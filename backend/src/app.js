import express from 'express';
import cors from 'cors';
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

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const app = express();

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

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
