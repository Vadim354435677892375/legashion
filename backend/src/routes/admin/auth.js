import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { BCRYPT_ROUNDS } from '../../lib/password.js';
import { JwtConfigError, signAdminToken } from '../../lib/jwt.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { requireAdmin } from '../../middleware/adminAuth.js';

export const adminAuthRouter = Router();

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
