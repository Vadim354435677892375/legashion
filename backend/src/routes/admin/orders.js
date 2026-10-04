import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { releaseStock, reserveStock } from '../../lib/stock.js';

export const adminOrdersRouter = Router();

const STATUSES = ['NEW', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

// GET /api/admin/orders?status=NEW — список заказов, опционально по статусу,
// свежие сверху.
adminOrdersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const orders = await prisma.order.findMany({
      where: status ? { status: String(status) } : undefined,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  })
);

adminOrdersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new HttpError(404, 'Заказ не найден');
    res.json(order);
  })
);

const statusSchema = z.object({ status: z.enum(STATUSES) });

// PATCH /api/admin/orders/:id/status — двигать заказ по воронке
// (NEW → PROCESSING → SHIPPED → COMPLETED, либо CANCELLED в любой момент).
adminOrdersRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { status } = statusSchema.parse(req.body);

    const exists = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!exists) throw new HttpError(404, 'Заказ не найден');

    // Остаток привязан к отмене: отменили — вернули на склад, вернули заказ в работу — снова
    // списали (если за это время товар разобрали, вернётся 409 и статус не изменится).
    const order = await prisma.$transaction(async (tx) => {
      if (exists.status !== 'CANCELLED' && status === 'CANCELLED') {
        await releaseStock(tx, exists.items);
      } else if (exists.status === 'CANCELLED' && status !== 'CANCELLED') {
        await reserveStock(tx, exists.items);
      }
      return tx.order.update({ where: { id }, data: { status } });
    });
    res.json(order);
  })
);
