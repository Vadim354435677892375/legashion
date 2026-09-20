import { z } from 'zod';
import { isStorageUrl } from '../lib/s3.js';

// Принимаем только ссылки на файлы в нашем бакете (см. isStorageUrl) — то есть то,
// что вернул POST /api/admin/upload/presign после загрузки.
export const storageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine(isStorageUrl, 'Ссылка должна вести на файл из хранилища сайта — загрузите файл через админку');

export const slotSchema = z.object({ url: storageUrl });

export const trackSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название ролика').max(120),
  videoUrl: storageUrl,
  posterUrl: storageUrl.nullish(),
});

export const trackOrderSchema = z.object({
  ids: z.array(z.number().int()).max(200),
});

export const bannerSchema = z.object({
  videoUrl: storageUrl.nullable(),
  posterUrl: storageUrl.nullable(),
});
