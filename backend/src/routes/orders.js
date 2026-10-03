import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/errorHandler.js';
import { createOrderSchema } from '../schemas/order.js';
import { priceOrderItems, resolvePromo } from '../lib/orderPricing.js';
import { notifyTelegramNewOrder } from '../lib/telegram.js';
import { notifyEmailNewOrder } from '../lib/email.js';

export const ordersRouter = Router();

// Номер заказа вида LG-241209-7K3F: дата + короткий случайный суффикс —
// компактно, читаемо клиенту в переписке и практически без коллизий.
function generateOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LG-${date}-${suffix}`;
}

// POST /api/orders — оформление заказа (гостевой чекаут, без аккаунта).
// Соответствует TODO в CheckoutPage.jsx: «когда появится бэкенд — отправлять заказ администратору здесь».
ordersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createOrderSchema.parse(req.body);

    // Цены и размеры считаем на сервере по актуальному каталогу — данным от клиента не доверяем.
    const { items, subtotal } = await priceOrderItems(data.items);

    // Промокод (если указан) находим и проверяем здесь же, а не в транзакции ниже:
    // ошибка «код не найден»/«истёк» должна вернуться клиенту без создания заказа.
    const { promo, discountAmount } = await resolvePromo(data.promoCode, subtotal);
    const totalPrice = subtotal - discountAmount;

    // Создание заказа и увеличение счётчика использований промокода — одной транзакцией,
    // чтобы при гонке двух заказов с одним кодом usedCount не разъехался с реальным числом заказов.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          fullName: data.fullName,
          phoneCallingCode: data.phoneCallingCode,
          phone: data.phone,
          email: data.email,
          countryCode: data.countryCode,
          city: data.city,
          cityData: data.cityData ?? undefined,
          address: data.address,
          addressData: data.addressData ?? undefined,
          comment: data.comment || null,
          promoCode: promo ? promo.code : null,
          discountAmount,
          deliveryType: data.deliveryType,
          paymentMethod: data.paymentMethod,
          totalPrice,
          items: { create: items },
        },
        include: { items: true },
      });

      if (promo) {
        await tx.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
      }

      return created;
    });

    // Уведомления не должны валить успешный ответ клиенту, если, скажем,
    // Telegram недоступен — поэтому каналы шлются параллельно и ошибка одного
    // не влияет ни на второй, ни на ответ. await обязателен: на Vercel функция
    // «замораживается» сразу после ответа, и неоконченная отправка потерялась бы.
    // Ошибки не глотаем молча, а пишем в лог — иначе непонятно, почему нет сообщения.
    const channels = ['telegram', 'email'];
    const results = await Promise.allSettled([
      notifyTelegramNewOrder(order),
      notifyEmailNewOrder(order),
    ]);
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(
          `[orders] уведомление (${channels[idx]}) о заказе ${order.orderNumber} не отправлено:`,
          result.reason?.message ?? result.reason
        );
      }
    });

    res.status(201).json({
      orderNumber: order.orderNumber,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount,
      status: order.status,
    });
  })
);

// GET /api/orders/:orderNumber — проверить статус своего заказа по номеру
// (без аккаунта это единственный способ клиенту посмотреть статус позже).
ordersRouter.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { items: true },
    });
    if (!order) throw new HttpError(404, 'Заказ не найден');

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount,
      deliveryType: order.deliveryType,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ name: i.name, size: i.size, price: i.price, qty: i.qty })),
      createdAt: order.createdAt,
    });
  })
);
