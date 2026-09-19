import { mock } from 'node:test';
import bcrypt from 'bcryptjs';
import { createFakePrisma } from './fakePrisma.js';

export const JWT_SECRET = 'test-secret-'.padEnd(48, 'x');

// node:test не даёт замокать один и тот же модуль дважды в одном процессе,
// поэтому fake-БД создаём один раз, а между загрузками приложения просто очищаем.
let sharedPrisma = null;

/** Подменяет lib/prisma.js на имитацию и возвращает свежее приложение + fake-БД. */
export async function loadApp({ env = {}, cacheKey = 'default' } = {}) {
  process.env.JWT_SECRET = JWT_SECRET;
  Object.assign(process.env, env);

  if (!sharedPrisma) {
    sharedPrisma = createFakePrisma();
    mock.module(new URL('../src/lib/prisma.js', import.meta.url).href, {
      namedExports: { prisma: sharedPrisma },
    });
  }
  const prisma = sharedPrisma;
  Object.assign(prisma._db, { admins: [], attempts: [], products: [], orders: [] });

  // Query-строка нужна, чтобы app.js перечитал process.env (NODE_ENV, CORS_ORIGIN) заново.
  const { app } = await import(`../src/app.js?${cacheKey}`);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  return { prisma, base, close: () => new Promise((r) => server.close(r)) };
}

export function addAdmin(prisma, { email = 'admin@legashion.ru', password = 'correct-horse-battery' } = {}) {
  const admin = {
    id: prisma._db.nextId++,
    email,
    passwordHash: bcrypt.hashSync(password, 4), // низкая стоимость — только чтобы тесты шли быстро
  };
  prisma._db.admins.push(admin);
  return { admin, password };
}

/** Логин с заданным «клиентским» IP (через X-Forwarded-For, как за прокси Vercel). */
export function login(base, { email, password, ip = '203.0.113.1' }) {
  return fetch(`${base}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify({ email, password }),
  });
}
