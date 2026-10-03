import { useCallback, useEffect, useRef, useState } from 'react';
import './ModelsBlock.css';
import paintFrame from '../../../../assets/paint-frame.png';
import { useSiteMedia } from '../../../../hooks/useSiteMedia';
import FadeBg from '../../../../components/FadeBg';

// Блок «Фото моделей» — реальный скриншот окна Paint (из макета) как фон,
// а поверх белого холста этого скриншота накладываются фото моделей.
// mediaKey: ключ слота с фото — загружается в админке (Медиа → «Главная — фото моделей»).
// Первые 3 фото показываются всегда (пока фото нет — светлый плейсхолдер), остальные —
// только если загружены. Фото шире окна, поэтому их листают вправо синим ползунком
// внизу окна (тянуть ползунок, кликать по стрелкам и по дорожке; на телефоне — свайпом).
const ALWAYS_VISIBLE = 3;
const MODELS = [1, 2, 3, 4, 5, 6].map((n) => ({ mediaKey: `models.look-${n}`, alt: `Look ${n}` }));

export default function ModelsBlock() {
  const media = useSiteMedia();
  const scrollerRef = useRef(null);
  const trackRef = useRef(null);
  const drag = useRef(null);
  // thumb: { width, left } в процентах от дорожки; null — листать нечего
  const [thumb, setThumb] = useState(null);

  const items = MODELS.filter(({ mediaKey }, i) => i < ALWAYS_VISIBLE || media.get(mediaKey));

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) {
      setThumb(null);
      return;
    }
    const range = el.scrollWidth - el.clientWidth;
    const width = (el.clientWidth / el.scrollWidth) * 100;
    const left = (el.scrollLeft / range) * (100 - width);
    setThumb((prev) =>
      prev && prev.width === width && prev.left === left ? prev : { width, left }
    );
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update, items.length]);

  const scrollByPage = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    // шаг — одно фото
    const step = el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width : el.clientWidth / 2;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const onThumbDown = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, scroll: el.scrollLeft };
  };

  const onThumbMove = (e) => {
    const el = scrollerRef.current;
    const track = trackRef.current;
    if (!drag.current || !el || !track || !thumb) return;
    const travel = track.clientWidth * (1 - thumb.width / 100);
    if (travel <= 0) return;
    const range = el.scrollWidth - el.clientWidth;
    el.scrollLeft = drag.current.scroll + ((e.clientX - drag.current.x) / travel) * range;
  };

  const onThumbUp = () => {
    drag.current = null;
  };

  const onTrackDown = (e) => {
    if (!thumb || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPct = ((e.clientX - rect.left) / rect.width) * 100;
    scrollByPage(clickPct < thumb.left ? -2 : 2);
  };

  return (
    <div className="paint-window">
      <img className="paint-window-bg" src={paintFrame} alt="" />
      <div className="paint-canvas-overlay" ref={scrollerRef} onScroll={update}>
        {items.map(({ mediaKey, alt }) => (
          <FadeBg
            src={media.get(mediaKey)}
            className="paint-photo"
            key={mediaKey}
            role="img"
            aria-label={alt}
          />
        ))}
      </div>

      {/* Рабочий горизонтальный скроллбар поверх нарисованного на скриншоте */}
      <button
        type="button"
        className="paint-scroll-arrow paint-scroll-arrow--left"
        aria-label="Листать влево"
        disabled={!thumb}
        onClick={() => scrollByPage(-1)}
      />
      <div className="paint-scroll-track" ref={trackRef} onPointerDown={onTrackDown}>
        {thumb && (
          <div
            className="paint-scroll-thumb"
            style={{ width: `${thumb.width}%`, left: `${thumb.left}%` }}
            onPointerDown={onThumbDown}
            onPointerMove={onThumbMove}
            onPointerUp={onThumbUp}
            onPointerCancel={onThumbUp}
          />
        )}
      </div>
      <button
        type="button"
        className="paint-scroll-arrow paint-scroll-arrow--right"
        aria-label="Листать вправо"
        disabled={!thumb}
        onClick={() => scrollByPage(1)}
      />
    </div>
  );
}
