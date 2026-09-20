import { useCallback, useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../../utils/adminApi';
import { MEDIA_LIMITS_HINT, useMediaActions } from './mediaActions';
import { SlotCard, UploadButton } from './mediaParts';

// Вкладка «Медиа» — замена картинок и видео сайта, которые НЕ привязаны к коллекции:
//  1. слоты-картинки (заставка, логотип, фото моделей, карточка «Лонгсливы») — список слотов
//     приходит с бэкенда (backend/src/lib/mediaSlots.js);
//  2. плейлист видеоплеера на главной.
// Всё, что относится к конкретной коллекции (карточка на главной, промо-видео, баннер Archive,
// фото «Футболок»), меняется в форме коллекции — вкладка «Коллекции». Фото товаров — в карточке
// товара. Файлы грузятся напрямую в бакет по подписанной ссылке (см. mediaParts.jsx).

function titleFromFile(file) {
  return file.name.replace(/\.[^.]+$/, '').trim().slice(0, 120) || 'Ролик';
}

function TrackRow({ track, index, total, media, onMove }) {
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
          <button
            type="button"
            disabled={media.working || !dirty}
            onClick={() => media.act(() => adminPut(url, body({})))}
          >
            Сохранить
          </button>
        </div>

        <div className="admin-media-actions">
          <UploadButton
            id={`track:${track.id}:video`}
            kind="video"
            media={media}
            onFile={(file) =>
              media.uploadThen(`track:${track.id}:video`, file, 'video', (videoUrl) =>
                adminPut(url, body({ videoUrl }))
              )
            }
          >
            Заменить видео
          </UploadButton>
          <UploadButton
            id={`track:${track.id}:poster`}
            kind="image"
            media={media}
            onFile={(file) =>
              media.uploadThen(`track:${track.id}:poster`, file, 'image', (posterUrl) =>
                adminPut(url, body({ posterUrl }))
              )
            }
          >
            {track.posterUrl ? 'Заменить постер' : 'Добавить постер'}
          </UploadButton>
          {track.posterUrl && (
            <button
              type="button"
              disabled={media.working}
              onClick={() => media.act(() => adminPut(url, body({ posterUrl: null })))}
            >
              Убрать постер
            </button>
          )}
        </div>
      </div>

      <div className="admin-track-side">
        <button type="button" disabled={media.working || index === 0} onClick={() => onMove(index, -1)}>
          ↑
        </button>
        <button
          type="button"
          disabled={media.working || index === total - 1}
          onClick={() => onMove(index, 1)}
        >
          ↓
        </button>
        <button
          type="button"
          className="admin-danger"
          disabled={media.working}
          onClick={() => {
            if (window.confirm(`Удалить ролик «${track.title}»? Файлы будут удалены из хранилища.`)) {
              media.act(() => adminDelete(url));
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
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await adminGet('/api/admin/site-media'));
      setLoadError(null);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const media = useMediaActions(load);

  if (!data) {
    return (
      <section className="admin-section">
        <div className="admin-section-head">
          <h2>Медиа сайта</h2>
        </div>
        {loadError ? <p className="admin-error">{loadError}</p> : <p className="admin-muted">Загрузка...</p>}
      </section>
    );
  }

  function moveTrack(index, delta) {
    const ids = data.tracks.map((t) => t.id);
    const target = index + delta;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    media.act(() => adminPut('/api/admin/site-media/tracks/order', { ids }));
  }

  // Только слоты без привязки к коллекции — по группам, в порядке, как их отдал бэкенд.
  const groups = [];
  for (const slot of data.slots.filter((s) => !s.collection)) {
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
        {MEDIA_LIMITS_HINT} Изменения появляются на сайте сразу; если он уже открыт — обновите
        страницу.
      </p>
      <p className="admin-muted">
        Картинки и видео, которые относятся к коллекции (карточка на главной, промо-видео, баннер
        Archive, фото на странице «Футболки»), меняются на вкладке «Коллекции» — кнопка «Изменить»
        у нужной коллекции. Фото товаров — в карточке товара.
      </p>

      {loadError && <p className="admin-error">{loadError}</p>}
      {media.error && <p className="admin-error">{media.error}</p>}

      {groups.map((group) => (
        <div className="admin-media-group" key={group.name}>
          <h3>{group.name}</h3>
          <div className="admin-media-grid">
            {group.slots.map((slot) => (
              <SlotCard key={slot.key} slot={slot} media={media} />
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
                media={media}
                onMove={moveTrack}
              />
            ))}
          </ul>
        )}

        <UploadButton
          id="track:new"
          kind="video"
          primary
          media={media}
          onFile={(file) =>
            media.uploadThen('track:new', file, 'video', (videoUrl) =>
              adminPost('/api/admin/site-media/tracks', { title: titleFromFile(file), videoUrl })
            )
          }
        >
          + Добавить ролик
        </UploadButton>
      </div>
    </section>
  );
}
