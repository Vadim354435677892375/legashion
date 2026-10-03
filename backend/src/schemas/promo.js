import { z } from 'zod';

export const upsertPromoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,32}$/, 'Код — 3–32 символа: латиница, цифры, дефис и подчёркивание'),
    discountType: z.enum(['PERCENT', 'FIXED']),
    value: z.number().int().positive('Размер скидки должен быть положительным числом'),
    isActive: z.boolean().default(true),
    expiresAt: z.coerce.date().nullable().optional(),
    maxUses: z.number().int().positive('Лимит использований — положительное число').nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENT' && data.value > 100) {
      ctx.addIssue({ code: 'custom', path: ['value'], message: 'Процент скидки не может быть больше 100' });
    }
  });
