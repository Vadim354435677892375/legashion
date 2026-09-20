import { useCallback, useEffect, useState } from 'react';
import {
  adminDelete,
  adminGet,
  adminPost,
  adminPut,
  adminUploadMedia,
} from '../../../utils/adminApi';

// Вкладка «Медиа» — замена картинок и видео на сайте без правки кода.
// Три части:
//  1. слоты-картинки (заставка, логотип, карточки категорий, фото моделей, баннер Archive…) —
//     список слотов приходит с бэкенда (backend/src/lib/mediaSlots.js);
//  2. плейлист видеоплеера на главной;
//  3. промо-видео на страницах коллекций.
// Файлы грузятся напрямую в бакет по подписанной ссылке (adminUploadMedia), затем ссылка
// сохраняется на бэкенде. Одновременно идёт одна загрузка — остальные кнопки на это время
// блокируются, так проще и нет гонок при перезагрузке данных.
//
// Фото товаров здесь не меняются — они правятся в карточке товара, вкладка «Товары».

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/avif';
const VIDEO_ACCEPT = 'video/mp4,video/webm';

const KIND_ERROR = {
  image: 'Нужна картинка: JPG, PNG, GIF, WebP или AVIF',
  video: 'Нужен видеофайл: MP4 или WebM',
};

function titleFromFile(file) {
  return file.name.replace(/\.[^.]+$/, '').trim().slice(0, 120) || 'Ролик';
}

// Кнопка-«файлоприёмник»: label с невидимым input внутри. Пока идёт загрузка именно
// через эту кнопку, вместо подписи показывается прогресс.
function UploadButton({ id, kind, upload, disabled, onFile, primary, children }) {
  const active = upload?.id === id;
  const className = ['admin-upload', primary && 'admin-upload-primary', disabled && 'is-disabled']
    .filter(Boolean)
    .join(' ');

  return (
    <label className={className}>
      {active ? `Загрузка… ${Math.round(upload.progress * 100)}%` : children}
      <input
        type="file"
        accept={kind === 'video' ? VIDEO_ACCEPT : IMAGE_ACCEPT}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // чтобы тот же файл можно было выбрать повторно
          if (file) onFile(file);
        }}
      />
    </label>
  );
}

function TrackRow({ track, index, total, upload, working, uploadThen, act, onMove }) {
  const [title, setTitle] = useState(track.title);
  useEffect(() => setTitle(track.title), [track.title]);

  const url = `/api/admin/site-media/tracks/${track.id}`;
  const body = (patch) => ({
    title: title.trim() || track.title,
    videoUrl: track.videoUrl,
    posterUrl: track.posterUrl,
    ...patch,
  });
  const dirty = title.trim() !== track.title && title.trim() !== '';

  return (
    <li className="admin-track">
      <video
        className="admin-track-video"
        src={track.videoUrl}
        poster={track.posterUrl ?? undefined}
        controls
        preload="metadata"
      />

      <div className="admin-track-main">
        <div className="admin-track-title">
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Название ролика"
          />
          <button type="button" disabled={working || !dirty} onClick={() => act(() => adminPut(url, body({})))}>
            Сохранить
          </button>
        </div>

        <div className="admin-media-actions">
          <UploadButton
            id={`track:${track.id}:video`}
            kind="video"
            upload={upload}
            disabled={working}
            onFile={(file) =>
              uploadThen(`track:${track.id}:video`, file, 'video', (videoUrl) =>
                adminPut(url, body({ videoUrl }))
              )
            }
          >
            Заменить видео
          </UploadButton>
          <UploadButton
            id={`track:${track.id}:poster`}
            kind="image"
            upload={upload}
            disabled={working}
            onFile={(file) =>
              uploadThen(`track:${track.id}:poster`, file, 'image', (posterUrl) =>
                adminPut(url, body({ posterUrl }))
              )
            }
          >
            {track.posterUrl ? 'Заменить постер' : 'Добавить постер'}
          </UploadButton>
          {track.posterUrl && (
            <button
              type="button"
              disabled={working}
              onClick={() => act(() => adminPut(url, body({ posterUrl: null })))}
            >
              Убрать постер
            </button>
          )}
        </div>
      </div>

      <div className="admin-track-side">
        <button type="button" disabled={working || index === 0} onClick={() => onMove(index, -1)}>
          ↑
        </button>
        <button type="button" disabled={working || index === total - 1} onClick={() => onMove(index, 1)}>
          ↓
        </button>
        <button
          type="button"
          className="admin-danger"
          disabled={working}
          onClick={() => {
            if (window.confirm(`Удалить ролик «${track.title}»? Файлы будут удалены из хранилища.`)) {
              act(() => adminDelete(url));
            }
          }}
        >
          ✕
        </button>
      </div>
    </li>
  );
}

export default function MediaTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [upload, setUpload] = useState(null); // { id, progress } — идёт загрузка файла
  const [busy, setBusy] = useState(false); // идёт обычный запрос (сброс, порядок, удаление)

  const working = Boolean(upload) || busy;

  const load = useCallback(async () => {
    try {
      setData(await adminGet('/api/admin/site-media'));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Загрузить файл в бакет → передать полученный URL в apply (сохранение на бэкенде) → обновить данные.
  async function uploadThen(id, file, kind, apply) {
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
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpload(null);
    }
  }

  async function act(fn) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function moveTrack(index, delta) {
    const ids = data.tracks.map((t) => t.id);
    const target = index + delta;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    act(() => adminPut('/api/admin/site-media/tracks/order', { ids }));
  }

  if (!data) {
    return (
      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Медиа сайта</h2>
        </div>
        {error ? <p className="admin-error">{error}</p> : <p className="admin-muted">Загрузка...</p>}
      </section>
    );
  }

  // Слоты — по группам, в порядке, в котором их отдал бэкенд.
  const groups = [];
  for (const slot of data.slots) {
    let group = groups.find((g) => g.name === slot.group);
    if (!group) groups.push((group = { name: slot.group, slots: [] }));
    group.slots.push(slot);
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Медиа сайта</h2>
      </div>

      <p className="admin-muted">
        Картинки: JPG, PNG, GIF, WebP, AVIF — до 20 МБ. Видео: MP4 или WebM — до 200 МБ (лучше MP4
        H.264 до 30 МБ, чтобы не тормозило на мобильном интернете). Изменения появляются на сайте
        сразу; если уже открыт — обновите страницу. Фото товаров меняются в карточке товара.
      </p>

      {error && <p className="admin-error">{error}</p>}

      {groups.map((group) => (
        <div className="admin-media-group" key={group.name}>
          <h3>{group.name}</h3>
          <div className="admin-media-grid">
            {group.slots.map((slot) => (
              <div className="admin-media-card" key={slot.key}>
                <div className="admin-media-thumb">
                  {slot.url ? (
                    <img src={slot.url} alt="" />
                  ) : (
                    <span className="admin-muted">стандартное</span>
                  )}
                </div>
                <div className="admin-media-body">
                  <strong>{slot.label}</strong>
                  {slot.hint && <span className="admin-media-hint">{slot.hint}</span>}
                  <div className="admin-media-actions">
                    <UploadButton
                      id={slot.key}
                      kind="image"
                      upload={upload}
                      disabled={working}
                      onFile={(file) =>
                        uploadThen(slot.key, file, 'image', (url) =>
                          adminPut(`/api/admin/site-media/slots/${encodeURIComponent(slot.key)}`, { url })
                        )
                      }
                    >
                      {slot.url ? 'Заменить' : 'Загрузить'}
                    </UploadButton>
                    {slot.url && (
                      <button
                        type="button"
                        className="admin-danger"
                        disabled={working}
                        onClick={() => {
                          if (window.confirm('Вернуть стандартную картинку? Загруженный файл будет удалён.')) {
                            act(() =>
                              adminDelete(`/api/admin/site-media/slots/${encodeURIComponent(slot.key)}`)
                            );
                          }
                        }}
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="admin-media-group">
        <h3>Плеер на главной</h3>
        <p className="admin-muted">
          Ролики в окне Windows Media Player. Порядок здесь — порядок в плейлисте, после ролика
          автоматически включается следующий. Постер — картинка, которая видна, пока видео не
          запущено. Пока роликов нет, на сайте показывается заглушка «Промо-видео скоро».
        </p>

        {data.tracks.length > 0 && (
          <ul className="admin-tracks">
            {data.tracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index}
                total={data.tracks.length}
                upload={upload}
                working={working}
                uploadThen={uploadThen}
                act={act}
                onMove={moveTrack}
              />
            ))}
          </ul>
        )}

        <UploadButton
          id="track:new"
          kind="video"
          primary
          upload={upload}
          disabled={working}
          onFile={(file) =>
            uploadThen('track:new', file, 'video', (videoUrl) =>
              adminPost('/api/admin/site-media/tracks', { title: titleFromFile(file), videoUrl })
            )
          }
        >
          + Добавить ролик
        </UploadButton>
      </div>

      <div className="admin-media-group">
        <h3>Промо-видео коллекций</h3>
        <p className="admin-muted">
          Показывается на странице коллекции вместо надписи «Промо-видео коллекции скоро». У
          страниц Sale, Archive и «Футболки» видео-баннера нет — у них свой макет.
        </p>

        {data.collections.length === 0 ? (
          <p className="admin-muted">Пока нет коллекций с видео-баннером — заведите их на вкладке «Коллекции».</p>
        ) : (
          <div className="admin-media-grid admin-media-grid-wide">
            {data.collections.map((c) => {
              const url = `/api/admin/site-media/collections/${c.id}/banner`;
              const body = (patch) => ({
                videoUrl: c.bannerVideoUrl,
                posterUrl: c.bannerPosterUrl,
                ...patch,
              });
              return (
                <div className="admin-media-card admin-media-card-wide" key={c.id}>
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
                    <strong>{c.title}</strong>
                    <span className="admin-media-hint">
                      <code>/collection/{c.slug}</code>
                    </span>
                    <div className="admin-media-actions">
                      <UploadButton
                        id={`banner:${c.id}:video`}
                        kind="video"
                        upload={upload}
                        disabled={working}
                        onFile={(file) =>
                          uploadThen(`banner:${c.id}:video`, file, 'video', (videoUrl) =>
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
                          upload={upload}
                          disabled={working}
                          onFile={(file) =>
                            uploadThen(`banner:${c.id}:poster`, file, 'image', (posterUrl) =>
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
                          disabled={working}
                          onClick={() => act(() => adminPut(url, body({ posterUrl: null })))}
                        >
                          Убрать постер
                        </button>
                      )}
                      {c.bannerVideoUrl && (
                        <button
                          type="button"
                          className="admin-danger"
                          disabled={working}
                          onClick={() => {
                            if (window.confirm('Убрать видео (и постер) со страницы коллекции? Файлы будут удалены.')) {
                              act(() => adminPut(url, { videoUrl: null, posterUrl: null }));
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
            })}
          </div>
        )}
      </div>
    </section>
  );
}
