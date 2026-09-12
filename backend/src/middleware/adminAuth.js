import jwt from 'jsonwebtoken';

// Защищает /api/admin/* — ожидает заголовок Authorization: Bearer <token>,
// выданный при логине в routes/admin/auth.js.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Нет токена авторизации' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Токен недействителен или истёк' });
  }
}
