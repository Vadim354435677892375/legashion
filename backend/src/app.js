import express from 'express';
import helmet from 'helmet';
import 'dotenv/config';

import { productsRouter } from './routes/products.js';
import { collectionsRouter } from './routes/collections.js';
import { ordersRouter } from './routes/orders.js';
import { geocodeRouter } from './routes/geocode.js';
import { adminAuthRouter } from './routes/admin/auth.js';
import { adminProductsRouter } from './routes/admin/products.js';
import { adminCollectionsRouter } from './routes/admin/collections.js';
import { adminOrdersRouter } from './routes/admin/orders.js';
import { adminUploadRouter } from './routes/admin/upload.js';
import { requireAdmin } from './middleware/adminAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { assertJwtConfig } from './lib/jwt.js';

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';

// Локально (CORS_ORIGIN пуст) пускаем любой origin, чтобы не мучиться с настройкой.
// В проде пустой список НЕ означает «всем можно»: без явного списка CORS выключен.
if (isProduction && allowedOrigins.length === 0) {
  console.error('[cors] CORS_ORIGIN не задан — в продакшене cross-origin запросы будут отклонены');
}

// В serverless-режиме на Vercel сервер не «стартует», поэтому проверку секрета из server.js
// там не выполнить — логируем проблему при загрузке модуля, чтобы она была видна в логах.
// Сам запрос к админке при этом всё равно упадёт безопасно (500), см. middleware/adminAuth.js.
try {
  assertJwtConfig();
} catch (err) {
  console.error('[jwt]', err.message);
}

export const app = express();

// Бэкенд стоит за прокси Vercel — без этого req.ip был бы адресом прокси, а не клиента,
// и лимит попыток входа считался бы на всех сразу. Значение 1 = доверяем ровно одному прокси.
app.set('trust proxy', 1);

// Базовые защитные заголовки (X-Content-Type-Options, HSTS, скрытие X-Powered-By и т.д.).
// Это чистый JSON-API, поэтому CORP ставим cross-origin — иначе фронт на другом домене
// не сможет забирать ответы.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use((req, res, next) => {
  // Ставим CORS-заголовки вручную, а не через пакет `cors`: в связке с
  // авто-определением Express-фреймворка на Vercel заголовки из `cors()`
  // почему-то не долетали до браузера. Ручная установка — надёжнее.
  const origin = req.headers.origin;
  const isAllowed =
    allowedOrigins.length === 0 ? !isProduction : Boolean(origin && allowedOrigins.includes(origin));

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, corsOriginEnv: process.env.CORS_ORIGIN || null })
);

// Публичные роуты — доступны фронтенду магазина без авторизации.
app.use('/api/products', productsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/geocode', geocodeRouter);

// Админ-роуты: /api/admin/auth/* открыт (логин), остальное — за requireAdmin.
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/products', requireAdmin, adminProductsRouter);
app.use('/api/admin/collections', requireAdmin, adminCollectionsRouter);
app.use('/api/admin/orders', requireAdmin, adminOrdersRouter);
app.use('/api/admin/upload', requireAdmin, adminUploadRouter);

app.use((req, res) => res.status(404).json({ error: 'Маршрут не найден' }));
app.use(errorHandler);

// Vercel в режиме встроенной поддержки Express-проектов (см. предупреждение
// "Internal rewrites in backend framework projects" в билд-логах) ищет точку
// входа именно здесь и ожидает default export — оставляем и его, и именованный
// export const app выше (используется в api/index.js и локальном server.js).
export default app;