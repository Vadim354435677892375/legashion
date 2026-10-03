import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { upsertPromoSchema } from '../../schemas/promo.js';

export const adminPromoCodesRouter = Router();

// Повтор кода упал бы 500 «Внутренняя ошибка сервера» — отвечаем понятным 409.
function rethrowUniqueViolation(err) {
  if (err?.code === 'P2002') throw new HttpError(409, 'Промокод с таким кодом уже существует');
  throw err;
}

function toData(data) {
  return {
    code: data.code,
    discountType: data.discountType,
    value: data.value,
    isActive: data.isActive,
    expiresAt: data.expiresAt ?? null,
    maxUses: data.maxUses ?? null,
  };
}

adminPromoCodesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } }));
  })
);

adminPromoCodesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = upsertPromoSchema.parse(req.body);
    const promo = await prisma.promoCode.create({ data: toData(data) }).catch(rethrowUniqueViolation);
    res.status(201).json(promo);
  })
);

adminPromoCodesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = upsertPromoSchema.parse(req.body);

    const exists = await prisma.promoCode.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Промокод не найден');

    const promo = await prisma.promoCode
      .update({ where: { id }, data: toData(data) })
      .catch(rethrowUniqueViolation);
    res.json(promo);
  })
);

// В заказах промокод хранится текстом (Order.promoCode), а не ссылкой, поэтому
// удаление кода историю заказов не ломает.
adminPromoCodesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const exists = await prisma.promoCode.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Промокод не найден');

    await prisma.promoCode.delete({ where: { id } });
    res.json({ deleted: true });
  })
);
