import { z } from 'zod';
import { AVAILABLE_SIZES, DEFAULT_SIZES, normalizeSizes } from '../lib/sizes.js';

// Целое положительное число в заданных пределах (вес/габариты для доставки).
const shippingInt = (label, max, unit) =>
  z
    .number({ message: `${label}: укажите число` })
    .int(`${label}: только целое число`)
    .positive(`${label}: должно быть больше нуля`)
    .max(max, `${label}: не больше ${max} ${unit}`);

export const upsertProductSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название'),
  price: z.number().int().positive('Цена должна быть положительным числом'),
  discountPercent: z.number().int().min(0).max(100).default(0),
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  // вес и габариты для доставки — видны только в админке, публичный API их не отдаёт
  weightGrams: shippingInt('Вес', 100000, 'г'),
  lengthCm: shippingInt('Длина', 300, 'см'),
  widthCm: shippingInt('Ширина', 300, 'см'),
  heightCm: shippingInt('Высота', 300, 'см'),
  // размеры, доступные для заказа; пустой массив — товар без размера
  sizes: z
    .array(z.enum(AVAILABLE_SIZES, { message: `Размер должен быть одним из: ${AVAILABLE_SIZES.join(', ')}` }))
    .default(DEFAULT_SIZES)
    .transform(normalizeSizes),
  // остаток по размерам: { S: 3, M: 0 }. Размеры, которых нет в `sizes`, игнорируются;
  // не указанный размер = 0 (нет в наличии). Для товара без размеров — `quantity`.
  stock: z
    .record(z.string(), z.number().int().min(0, 'Количество не может быть отрицательным').max(100000))
    .default({}),
  quantity: z.number().int().min(0, 'Количество не может быть отрицательным').max(100000).default(0),
  // slugs существующих коллекций (home/sale/archive/tshirts/new-collection/...)
  collectionSlugs: z.array(z.string().trim().min(1)).default([]),
  // порядок картинок задаётся порядком в массиве
  imageUrls: z.array(z.string().url()).default([]),
});