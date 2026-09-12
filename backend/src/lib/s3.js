import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import path from 'node:path';

// Yandex Cloud Object Storage говорит по S3-протоколу, поэтому обычный
// @aws-sdk/client-s3 работает с ним «из коробки» — достаточно указать
// свой endpoint вместо amazonaws.com.
const s3 = new S3Client({
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.S3_BUCKET;
const PUBLIC_URL = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '');

/**
 * Загружает файл (buffer из multer) в бакет и возвращает публичный URL.
 * @param {Buffer} buffer
 * @param {string} originalName — исходное имя файла (для расширения)
 * @param {string} mimetype
 * @returns {Promise<string>} публичный URL загруженного файла
 */
export async function uploadImage(buffer, originalName, mimetype) {
  const ext = path.extname(originalName || '') || '.jpg';
  const key = `products/${Date.now()}-${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

/**
 * Удаляет файл из бакета по его публичному URL (используется при удалении фото товара).
 * @param {string} url
 */
export async function deleteImageByUrl(url) {
  if (!url || !url.startsWith(PUBLIC_URL)) return;
  const key = url.slice(PUBLIC_URL.length + 1);
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch((err) => {
    // Не роняем запрос из-за не удалившейся картинки — просто логируем.
    console.error('Не удалось удалить файл из S3:', key, err.message);
  });
}
