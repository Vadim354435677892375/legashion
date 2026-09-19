import { z } from 'zod';

// Повторяет форму, которую собирает CheckoutPage.jsx (DetailsForm + DeliveryBlock +
// PaymentBlock) — валидация на бэкенде обязательна, фронтовая же не защищает
// от прямых запросов к API в обход формы.
export const createOrderSchema = z.object({
  fullName: z.string().trim().min(1, 'Укажите ФИО'),
  phoneCallingCode: z.string().trim().min(1),
  phone: z.string().trim().min(1, 'Укажите телефон'),
  countryCode: z.string().trim().length(2),
  city: z.string().trim().min(1, 'Укажите город доставки'),
  cityData: z.any().optional(),
  address: z.string().trim().min(1, 'Укажите адрес доставки'),
  addressData: z.any().optional(),
  comment: z.string().trim().optional().default(''),
  promoCode: z.string().trim().optional().default(''),
  deliveryType: z.enum(['CDEK', 'RUSSIAN_POST']),
  paymentMethod: z.enum(['CARD', 'SBP']),
  // Цену и название клиент НЕ присылает: сервер берёт их из каталога по productId
  // (см. routes/orders.js). Иначе любой мог бы оформить заказ по цене в 1 рубль,
  // просто отправив запрос к API в обход формы.
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        size: z.enum(['S', 'M', 'L', 'XL']).optional().nullable(),
        qty: z.number().int().positive().max(20, 'Не больше 20 штук одной позиции'),
      })
    )
    .min(1, 'Корзина пуста')
    .max(30, 'Слишком много позиций в заказе'),
});
