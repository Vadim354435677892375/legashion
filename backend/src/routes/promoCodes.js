import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validatePromoSchema } from '../schemas/order.js';
import { priceOrderItems, resolvePromo } from '../lib/orderPricing.js';

export const promoCodesRouter = Router();

// POST /api/promo-codes/validate — предпросмотр скидки на чекауте, заказ не создаётся.
// Сумму корзины сервер считает сам по каталогу; итог при оформлении заказа
// пересчитывается заново, так что этот ответ ни на что не влияет, кроме подсказки покупателю.
promoCodesRouter.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { code, items } = validatePromoSchema.parse(req.body);
    const { subtotal } = await priceOrderItems(items);
    const { promo, discountAmount } = await resolvePromo(code, subtotal);

    res.json({
      code: promo.code,
      discountType: promo.discountType,
      value: promo.value,
      subtotal,
      discountAmount,
      totalPrice: subtotal - discountAmount,
    });
  })
);
