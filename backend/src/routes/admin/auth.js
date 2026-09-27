import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { BCRYPT_ROUNDS } from '../../lib/password.js';
import { JwtConfigError, signAdminToken } from '../../lib/jwt.js';
import { sendAdminLoginCode } from '../../lib/email.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { requireAdmin } from '../../middleware/adminAuth.js';

export const adminAuthRouter = Router();

// Второй шаг входа — код из письма (2FA). Код короткий (6 цифр), поэтому
// живёт недолго и допускает мало попыток подбора.
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;
// Если код уже запрашивали недавно — не шлём новое письмо на каждый лишний
// клик «Войти», а переиспользуем текущий код.
const RESEND_COOLDOWN_MS = 20 * 1000;

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode() {
  // Строго 6 цифр, включая ведущие нули.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

// admin@example.com → a****@example.com — чтобы фронт мог показать «код отправлен на …»,
// не раскрывая полный адрес в ответе.
function maskEmail(email) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const visible = name.slice(0, 1);
  return `${visible}${'*'.repeat(Math.max(name.length - 1, 1))}@${domain}`;
}

// Лимиты неудачных попыток в окне WINDOW_MS. Лимит на IP жёсткий; на email —
// мягче: иначе любой мог бы «заблокировать» админа, просто спамя его почту в форму.
// При этом 10 попыток на 15 минут — это ~1000 в сутки, что для пароля от 12 символов
// перебором не взять.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_PER_EMAIL = 10;
const KEEP_ATTEMPTS_MS = 24 * 60 * 60 * 1000;

// Хеш «несуществующего» пользователя: если email не найден, всё равно гоняем bcrypt,
// чтобы по времени ответа нельзя было отличить «нет такого email» от «неверный пароль».
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  // max — чтобы не заставлять сервер хешировать многомегабайтные «пароли».
  password: z.string().min(1).max(200),
});

// POST /api/admin/auth/login — единственный способ входа: email + пароль.
// Личных кабинетов покупателей нет — этот логин только для администратора(ов),
// записи в таблицу Admin создаются вручную через seed / scripts/set-admin-password.js (см. README).
adminAuthRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const ip = req.ip || 'unknown';

    const since = new Date(Date.now() - WINDOW_MS);
    const [ipFails, emailFails] = await Promise.all([
      prisma.loginAttempt.count({ where: { ip, createdAt: { gte: since } } }),
      prisma.loginAttempt.count({ where: { email, createdAt: { gte: since } } }),
    ]);

    if (ipFails >= MAX_FAILS_PER_IP || emailFails >= MAX_FAILS_PER_EMAIL) {
      res.setHeader('Retry-After', String(Math.ceil(WINDOW_MS / 1000)));
      throw new HttpError(429, 'Слишком много неудачных попыток входа. Попробуйте через 15 минут');
    }

    // insensitive — на случай, если email админа в БД записан с заглавными буквами.
    const admin = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);

    if (!admin || !valid) {
      await prisma.loginAttempt.create({ data: { email, ip } });
      // Заодно чистим старые записи, чтобы таблица не росла бесконечно.
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - KEEP_ATTEMPTS_MS) } },
      });
      throw new HttpError(401, 'Неверный email или пароль');
    }

    // Успешный вход сбрасывает счётчик по этому email (счётчик по IP остаётся).
    await prisma.loginAttempt.deleteMany({ where: { email } });

    // Пароль верный — но токен пока не выдаём, сначала код на почту (2FA).
    // Если недавно уже выпускали код для этого админа — не шлём письмо повторно,
    // а продлеваем срок действия того же кода (чтобы двойной клик по «Войти»
    // не заспамил почту и не заставил вводить новый код после старого письма).
    const recent = await prisma.adminLoginCode.findFirst({
      where: { adminId: admin.id, createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
      orderBy: { createdAt: 'desc' },
    });

    let verificationId;
    if (recent) {
      verificationId = recent.id;
    } else {
      await prisma.adminLoginCode.deleteMany({ where: { adminId: admin.id } });

      const code = generateCode();
      const created = await prisma.adminLoginCode.create({
        data: {
          adminId: admin.id,
          codeHash: hashCode(code),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      });
      verificationId = created.id;

      try {
        await sendAdminLoginCode(admin.email, code);
      } catch (err) {
        console.error('[admin/auth] Не удалось отправить код на почту:', err);
        await prisma.adminLoginCode.delete({ where: { id: created.id } }).catch(() => {});
        throw new HttpError(500, 'Не удалось отправить код на почту. Попробуйте ещё раз позже');
      }
    }

    res.json({
      verificationId,
      maskedEmail: maskEmail(admin.email),
      expiresInSeconds: Math.round(CODE_TTL_MS / 1000),
    });
  })
);

const verifyCodeSchema = z.object({
  verificationId: z.string().min(1),
  code: z.string().trim().regex(/^\d{6}$/, 'Код — 6 цифр'),
});

// POST /api/admin/auth/verify-code — второй шаг входа: код из письма.
// Успешная проверка выпускает тот же JWT, что раньше выдавался сразу в /login.
adminAuthRouter.post(
  '/verify-code',
  asyncHandler(async (req, res) => {
    const { verificationId, code } = verifyCodeSchema.parse(req.body);

    const record = await prisma.adminLoginCode.findUnique({ where: { id: verificationId } });

    // Нет записи — либо код никогда не запрашивали, либо уже использовали/удалили.
    if (!record) throw new HttpError(400, 'Код не найден или уже использован. Войдите заново');

    if (record.expiresAt < new Date()) {
      await prisma.adminLoginCode.delete({ where: { id: record.id } }).catch(() => {});
      throw new HttpError(400, 'Код истёк. Войдите заново, чтобы получить новый');
    }

    if (record.attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.adminLoginCode.delete({ where: { id: record.id } }).catch(() => {});
      throw new HttpError(429, 'Слишком много неверных попыток. Войдите заново, чтобы получить новый код');
    }

    if (hashCode(code) !== record.codeHash) {
      await prisma.adminLoginCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      const left = MAX_CODE_ATTEMPTS - record.attempts - 1;
      throw new HttpError(401, `Неверный код. Осталось попыток: ${Math.max(left, 0)}`);
    }

    const admin = await prisma.admin.findUnique({ where: { id: record.adminId } });
    // Код одноразовый — удаляем сразу после успешной проверки, независимо от того,
    // что будет дальше (даже если ниже вылетит ошибка выпуска токена).
    await prisma.adminLoginCode.delete({ where: { id: record.id } }).catch(() => {});

    if (!admin) throw new HttpError(401, 'Учётная запись не найдена');

    let token;
    try {
      token = signAdminToken(admin);
    } catch (err) {
      if (err instanceof JwtConfigError) {
        console.error('[admin/auth] Ошибка конфигурации JWT:', err.message);
        throw new HttpError(500, 'Внутренняя ошибка сервера');
      }
      throw err;
    }

    res.json({ token, email: admin.email });
  })
);

// GET /api/admin/auth/me — проверка валидности текущего токена (для фронта админки).
adminAuthRouter.get('/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});
