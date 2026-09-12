import { z } from 'zod';

export const upsertProductSchema = z.object({
  name: z.string().trim().min(1, 'Укажите название'),
  price: z.number().int().positive('Цена должна быть положительным числом'),
  discountPercent: z.number().int().min(0).max(100).default(0),
  density: z.string().trim().optional().nullable(),
  composition: z.string().trim().optional().nullable(),
  isActive: z.boolean().default(true),
  // slugs существующих коллекций (home/sale/archive/tshirts/new-collection/...)
  collectionSlugs: z.array(z.string().trim().min(1)).default([]),
  // порядок картинок задаётся порядком в массиве
  imageUrls: z.array(z.string().url()).default([]),
});
