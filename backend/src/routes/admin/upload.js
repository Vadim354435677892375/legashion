import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../../lib/s3.js';
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
