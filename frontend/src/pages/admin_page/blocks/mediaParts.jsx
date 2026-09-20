import { adminDelete, adminPut } from '../../../utils/adminApi';

// Общие компоненты для вкладок «Медиа» и «Коллекции»: и там и там меняются картинки/видео сайта.
// Логика загрузки — в mediaActions.js (отдельно, чтобы в этом файле были только компоненты).

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/avif';
const VIDEO_ACCEPT = 'video/mp4,video/webm';

// Кнопка-«файлоприёмник»: label с невидимым input внутри. Пока идёт загрузка именно
// через эту кнопку, вместо подписи показывается прогресс.
export function UploadButton({ id, kind, media, primary, onFile, children }) {
  const active = media.upload?.id === id;
  const className = ['admin-upload', primary && 'admin-upload-primary', media.working && 'is-disabled']
    .filter(Boolean)
    .join(' ');

  return (
    <label className={className}>
      {active ? `Загрузка… ${Math.round(media.upload.progress * 100)}%` : children}
      <input
        type="file"
        accept={kind === 'video' ? VIDEO_ACCEPT : IMAGE_ACCEPT}
        disabled={media.working}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // чтобы тот же файл можно было выбрать повторно
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

/** Карточка одного слота-картинки: превью, «Загрузить/Заменить», «Сбросить». */
export function SlotCard({ slot, label, media }) {
  const path = `/api/admin/site-media/slots/${encodeURIComponent(slot.key)}`;

  return (
    <div className="admin-media-card">
      <div className="admin-media-thumb">
        {slot.url ? <img src={slot.url} alt="" /> : <span className="admin-muted">стандартное</span>}
      </div>
      <div className="admin-media-body">
        <strong>{label ?? slot.label}</strong>
        {slot.hint && <span className="admin-media-hint">{slot.hint}</span>}
        <div className="admin-media-actions">
          <UploadButton
            id={slot.key}
            kind="image"
            media={media}
            onFile={(file) =>
              media.uploadThen(slot.key, file, 'image', (url) => adminPut(path, { url }))
            }
          >
            {slot.url ? 'Заменить' : 'Загрузить'}
          </UploadButton>
          {slot.url && (
            <button
              type="button"
              className="admin-danger"
              disabled={media.working}
              onClick={() => {
                if (window.confirm('Вернуть стандартную картинку? Загруженный файл будет удалён.')) {
                  media.act(() => adminDelete(path));
                }
              }}
            >
              Сбросить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Промо-видео (и постер) на странице коллекции. */
export function CollectionBannerCard({ collection, media }) {
  const c = collection;
  const url = `/api/admin/site-media/collections/${c.id}/banner`;
  const body = (patch) => ({ videoUrl: c.bannerVideoUrl, posterUrl: c.bannerPosterUrl, ...patch });

  return (
    <div className="admin-media-card admin-media-card-wide">
      <div className="admin-media-thumb admin-media-thumb-video">
        {c.bannerVideoUrl ? (
          <video
            src={c.bannerVideoUrl}
            poster={c.bannerPosterUrl ?? undefined}
            controls
            preload="metadata"
          />
        ) : (
          <span className="admin-muted">видео нет</span>
        )}
      </div>
      <div className="admin-media-body">
        <strong>Промо-видео на странице коллекции</strong>
        <span className="admin-media-hint">
          Показывается на <code>/collection/{c.slug}</code> вместо надписи «Промо-видео коллекции
          скоро». Постер виден, пока видео не запущено.
        </span>
        <div className="admin-media-actions">
          <UploadButton
            id={`banner:${c.id}:video`}
            kind="video"
            media={media}
            onFile={(file) =>
              media.uploadThen(`banner:${c.id}:video`, file, 'video', (videoUrl) =>
                adminPut(url, body({ videoUrl }))
              )
            }
          >
            {c.bannerVideoUrl ? 'Заменить видео' : 'Загрузить видео'}
          </UploadButton>
          {c.bannerVideoUrl && (
            <UploadButton
              id={`banner:${c.id}:poster`}
              kind="image"
              media={media}
              onFile={(file) =>
                media.uploadThen(`banner:${c.id}:poster`, file, 'image', (posterUrl) =>
                  adminPut(url, body({ posterUrl }))
                )
              }
            >
              {c.bannerPosterUrl ? 'Заменить постер' : 'Добавить постер'}
            </UploadButton>
          )}
          {c.bannerPosterUrl && (
            <button
              type="button"
              disabled={media.working}
              onClick={() => media.act(() => adminPut(url, body({ posterUrl: null })))}
            >
              Убрать постер
            </button>
          )}
          {c.bannerVideoUrl && (
            <button
              type="button"
              className="admin-danger"
              disabled={media.working}
              onClick={() => {
                if (window.confirm('Убрать видео (и постер) со страницы коллекции? Файлы будут удалены.')) {
                  media.act(() => adminPut(url, { videoUrl: null, posterUrl: null }));
                }
              }}
            >
              Убрать видео
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
