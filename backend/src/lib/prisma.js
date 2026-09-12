import { PrismaClient } from '@prisma/client';

// В serverless-окружении (Vercel) каждый холодный старт функции может создавать
// новый экземпляр PrismaClient — чтобы не плодить лишние соединения при hot-reload
// в деве, кэшируем клиент в globalThis (стандартный паттерн для Prisma + serverless).
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
