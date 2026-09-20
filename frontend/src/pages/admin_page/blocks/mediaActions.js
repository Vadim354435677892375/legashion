import { useCallback, useState } from 'react';
import { adminUploadMedia } from '../../../utils/adminApi';

// Логика загрузки медиа, общая для вкладок «Медиа» и «Коллекции» (компоненты — в mediaParts.jsx).

const KIND_ERROR = {
  image: 'Нужна картинка: JPG, PNG, GIF, WebP или AVIF',
  video: 'Нужен видеофайл: MP4 или WebM',
};

export const MEDIA_LIMITS_HINT =
  'Картинки: JPG, PNG, GIF, WebP, AVIF — до 20 МБ. Видео: MP4 или WebM — до 200 МБ ' +
  '(лучше MP4 H.264 до 30 МБ, чтобы не тормозило на мобильном интернете).';

/**
 * Состояние и действия для блока с загрузками.
 * @param {() => Promise<void>} reload — перечитать данные после любого изменения
 *
 * Одновременно идёт одна загрузка: пока она не закончится, остальные кнопки блока
 * заблокированы (working) — так проще и нет гонок при перечитывании данных.
 */
export function useMediaActions(reload) {
  const [upload, setUpload] = useState(null); // { id, progress } — идёт загрузка файла
  const [busy, setBusy] = useState(false); // идёт обычный запрос (сброс, удаление…)
  const [error, setError] = useState(null);

  // Загрузить файл в бакет → передать полученный URL в apply (сохранение на бэкенде) → reload.
  const uploadThen = useCallback(
    async (id, file, kind, apply) => {
      if (!file.type.startsWith(`${kind}/`)) {
        setError(KIND_ERROR[kind]);
        return;
      }
      setError(null);
      setUpload({ id, progress: 0 });
      try {
        const url = await adminUploadMedia(file, {
          onProgress: (progress) => setUpload({ id, progress }),
        });
        await apply(url);
        await reload();
      } catch (err) {
        setError(err.message);
      } finally {
        setUpload(null);
      }
    },
    [reload]
  );

  const act = useCallback(
    async (fn) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await reload();
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [reload]
  );

  return { upload, working: Boolean(upload) || busy, error, setError, uploadThen, act };
}
