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
  items: z
    .array(
      z.object({
        productId: z.number().int().optional().nullable(),
        name: z.string().trim().min(1),
        size: z.string().trim().optional().nullable(),
        price: z.number().int().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1, 'Корзина пуста'),
});
