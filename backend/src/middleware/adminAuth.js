import { prisma } from '../lib/prisma.js';
import { JwtConfigError, passwordFingerprint, verifyAdminToken } from '../lib/jwt.js';

// Защищает /api/admin/* — ожидает заголовок Authorization: Bearer <token>,
// выданный при логине в routes/admin/auth.js.
//
// Кроме проверки подписи и срока, сверяем токен с БД: админ должен всё ещё
// существовать, а его пароль — не меняться после выдачи токена. Так удаление
// админа или смена пароля сразу отзывает все его старые токены.
export async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Нет токена авторизации' });
    }

    let payload;
    try {
      payload = verifyAdminToken(token);
    } catch (err) {
      if (err instanceof JwtConfigError) throw err;
      return res.status(401).json({ error: 'Токен недействителен или истёк' });
    }

    const id = Number(payload.sub);
    const admin = Number.isInteger(id) ? await prisma.admin.findUnique({ where: { id } }) : null;

    // Токены старого формата (без pv) тоже сюда попадают и отклоняются — это нужно:
    // они выдавались до смены схемы и живут до 7 дней.
    if (!admin || !payload.pv || payload.pv !== passwordFingerprint(admin.passwordHash)) {
      return res.status(401).json({ error: 'Токен недействителен или истёк' });
    }

    req.admin = { id: admin.id, email: admin.email };
    next();
  } catch (err) {
    if (err instanceof JwtConfigError) {
      // Логируем причину, но клиенту её не раскрываем.
      console.error('[adminAuth] Ошибка конфигурации JWT:', err.message);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
    next(err);
  }
}
