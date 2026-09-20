import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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
  // Свежие версии SDK по умолчанию добавляют в запросы (и в подписанные ссылки) CRC32-чексумму,
  // которую S3-совместимые хранилища вроде Yandex Object Storage могут отвергать.
  // WHEN_REQUIRED возвращает прежнее поведение: чексумма только там, где её требует сам S3.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  // Для Yandex не нужно (у него адресация bucket.storage.yandexcloud.net). Включается только
  // для локальных S3-эмуляторов вроде MinIO, где бакет — часть пути, а не поддомен.
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
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

/**
 * Проверяет, что URL ведёт на файл в нашем бакете. Так админ не может подставить в слот
 * произвольную ссылку, а запрет на кавычки/скобки/пробелы защищает от выхода из
 * CSS-конструкции url(...), в которую фронт вставляет адрес фона.
 * @param {unknown} url
 */
export function isStorageUrl(url) {
  return (
    Boolean(PUBLIC_URL) &&
    typeof url === 'string' &&
    url.startsWith(`${PUBLIC_URL}/`) &&
    !/[\s"'()<>\\]/.test(url)
  );
}

/** true, если заданы все переменные, без которых загрузка в бакет невозможна. */
export function isStorageConfigured() {
  return Boolean(
    BUCKET &&
      PUBLIC_URL &&
      process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY
  );
}

const PRESIGN_TTL_SECONDS = 600;

/**
 * Готовит прямую загрузку файла в бакет из браузера: возвращает подписанный PUT-URL.
 * Файл идёт мимо нашего сервера — на Vercel у serverless-функции лимит тела запроса
 * ~4,5 МБ, видео через неё не пролезет.
 * Размер подписывается вместе с запросом: загрузить файл другой длины по этой ссылке нельзя.
 * @param {{ contentType: string, size: number, ext: string }} params
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, headers: Record<string,string> }>}
 */
export async function createPresignedUpload({ contentType, size, ext }) {
  const key = `media/${Date.now()}-${crypto.randomUUID()}${ext}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
      ACL: 'public-read',
    }),
    {
      expiresIn: PRESIGN_TTL_SECONDS,
      // По умолчанию SDK переносит x-amz-acl в query-строку. Обычный аплоад (uploadImage)
      // шлёт ACL заголовком — делаем так же и здесь, чтобы поведение совпадало с проверенным.
      // Клиент обязан отправить этот заголовок при PUT.
      unhoistableHeaders: new Set(['x-amz-acl']),
    }
  );

  return {
    uploadUrl,
    publicUrl: `${PUBLIC_URL}/${key}`,
    headers: { 'Content-Type': contentType, 'x-amz-acl': 'public-read' },
  };
}

/**
 * Удаляет файл, загруженный через раздел «Медиа» (папка media/). Файлы из других папок —
 * например фото товаров — не трогает: на них может ссылаться что-то ещё.
 * @param {string|null|undefined} url
 */
export async function deleteMediaByUrl(url) {
  if (!isStorageUrl(url)) return;
  if (!url.slice(PUBLIC_URL.length + 1).startsWith('media/')) return;
  await deleteImageByUrl(url);
}
