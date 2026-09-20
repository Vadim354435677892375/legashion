import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { createPresignedUpload, isStorageConfigured, uploadImage } from '../../lib/s3.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const adminUploadRouter = Router();

// Файл держим в памяти (не на диске) — для фото товаров это достаточно
// и проще всего переносится на serverless (нет персистентной файловой системы).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 МБ на файл
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new HttpError(400, 'Разрешены только изображения'));
    }
    cb(null, true);
  },
});

// POST /api/admin/upload — form-data, поле "image". Возвращает { url } для
// добавления в imageUrls при создании/редактировании товара.
adminUploadRouter.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'Файл не передан');

    const url = await uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    res.status(201).json({ url });
  })
);

// Форматы и лимиты для прямой загрузки (раздел «Медиа»). SVG намеренно нет: открытый
// напрямую SVG может исполнять скрипты. Видео — только mp4/webm: их играют все браузеры.
const MB = 1024 * 1024;
export const MEDIA_TYPES = {
  'image/jpeg': { ext: '.jpg', maxSize: 20 * MB },
  'image/png': { ext: '.png', maxSize: 20 * MB },
  'image/gif': { ext: '.gif', maxSize: 20 * MB },
  'image/webp': { ext: '.webp', maxSize: 20 * MB },
  'image/avif': { ext: '.avif', maxSize: 20 * MB },
  'video/mp4': { ext: '.mp4', maxSize: 200 * MB },
  'video/webm': { ext: '.webm', maxSize: 200 * MB },
};

const presignSchema = z.object({
  contentType: z.string().trim().toLowerCase(),
  size: z.number().int().positive(),
});

// POST /api/admin/upload/presign — { contentType, size } → { uploadUrl, publicUrl, headers }.
// Браузер сам делает PUT файла на uploadUrl с указанными headers (файл идёт мимо нашего
// сервера — у Vercel лимит на тело запроса ~4,5 МБ), а publicUrl потом отдаёт в
// PUT /api/admin/site-media/... — сервер принимает только такие ссылки.
adminUploadRouter.post(
  '/presign',
  asyncHandler(async (req, res) => {
    const { contentType, size } = presignSchema.parse(req.body);

    const type = MEDIA_TYPES[contentType];
    if (!type) {
      throw new HttpError(400, 'Формат не поддерживается. Картинки: JPG, PNG, GIF, WebP, AVIF. Видео: MP4, WebM.');
    }
    if (size > type.maxSize) {
      throw new HttpError(400, `Файл слишком большой: максимум ${type.maxSize / MB} МБ`);
    }
    if (!isStorageConfigured()) {
      throw new HttpError(503, 'Хранилище файлов не настроено (переменные S3_* на бэкенде)');
    }

    const upload = await createPresignedUpload({ contentType, size, ext: type.ext });
    res.status(201).json(upload);
  })
);
