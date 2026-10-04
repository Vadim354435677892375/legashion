import { useEffect, useRef, useState } from 'react';
import './Gallery.css';

// Длительность перелистывания фото, мс. Таймер завершения держится чуть дольше самой анимации.
const SLIDE_MS = 300;

// Пропорция блока, пока реальные размеры текущего фото ещё не известны
// (или фото нет вообще) — квадрат как безопасный дефолт.
const DEFAULT_RATIO = 1;

// Доля ширины, на которую нужно протянуть фото, чтобы оно перелистнулось (иначе вернётся назад),
// и порог «быстрого щелчка» пальцем (px/мс), при котором хватает короткого движения.
const SWIPE_DISTANCE_RATIO = 0.2;
const SWIPE_FAST_SPEED = 0.4;

const mod = (i, n) => ((i % n) + n) % n;

// Блок «Галерея товара» — большое фото + стрелки переключения (на компьютере) + превью снизу.
// images: массив путей к фото товара (например ['/assets/product-1.jpg', ...]).
// Пока фото нет — рисуется белый плейсхолдер вместо картинки.
//
// Фото листается свайпом: за пальцем едет «дорожка» из трёх слайдов (предыдущее, текущее,
// следующее), а при отпускании фото доезжает до места с анимацией — или возвращается назад,
// если протянули слишком мало. Листание по кругу: после последнего фото снова первое.
// На телефонах стрелки скрыты (CSS) — там листают пальцем; на компьютере стрелки и превью
// тоже перелистывают с анимацией.
//
// Пропорции блока подстраиваются под реальные размеры фото (чтобы не было белых полос
// и обрезки): размеры всех фото узнаём заранее, поэтому при смене фото блок плавно
// меняет высоту вместе с перелистыванием.
export default function Gallery({ images = [] }) {
  const slots = images.length > 0 ? images : [null, null, null];
  const count = slots.length;

  const [active, setActive] = useState(0);
  // Смещение дорожки за пальцем, px. 0 — текущее фото ровно по центру.
  const [offset, setOffset] = useState(0);
  // Пока идёт анимация: { dir: 1 | -1 } — перелистывание вперёд/назад, { dir: 0 } — возврат назад.
  const [anim, setAnim] = useState(null);
  // Пропорции (ширина / высота) загруженных фото: { [src]: number }.
  const [ratios, setRatios] = useState({});

  const viewportRef = useRef(null);
  const timerRef = useRef(null);
  const drag = useRef({ tracking: false, locked: false });

  const current = mod(active, count);
  const prevIndex = mod(current - 1, count);
  const nextIndex = mod(current + 1, count);

  // Подгружаем все фото заранее: так знаем их пропорции и соседние слайды
  // появляются под пальцем сразу, без «пустого» кадра.
  const imagesKey = images.join('\n');
  useEffect(() => {
    let cancelled = false;
    const list = imagesKey ? imagesKey.split('\n') : [];
    list.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        setRatios((prev) => (prev[src] ? prev : { ...prev, [src]: ratio }));
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [imagesKey]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Куда «едем»: во время анимации блок уже подстраивается под пропорции следующего фото.
  const targetIndex = anim ? mod(current + anim.dir, count) : current;
  const ratio = ratios[slots[targetIndex]] ?? DEFAULT_RATIO;

  const finishSlide = (dir) => {
    setActive((i) => mod(i + dir, count));
    setAnim(null);
    setOffset(0);
  };

  // Перелистнуть на соседнее фото с анимацией. dir: 1 — следующее, -1 — предыдущее.
  const slideTo = (dir) => {
    if (anim || count < 2) return;
    const width = viewportRef.current?.offsetWidth ?? 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !width) {
      setActive((i) => mod(i + dir, count));
      setOffset(0);
      return;
    }
    setAnim({ dir });
    setOffset(-dir * width);
    timerRef.current = setTimeout(() => finishSlide(dir), SLIDE_MS + 40);
  };

  const springBack = () => {
    setAnim({ dir: 0 });
    setOffset(0);
    timerRef.current = setTimeout(() => setAnim(null), SLIDE_MS);
  };

  // Клик по превью: соседнее фото — с анимацией, дальнее — сразу.
  const goTo = (index) => {
    if (anim || index === current) return;
    if (index === nextIndex) slideTo(1);
    else if (index === prevIndex) slideTo(-1);
    else setActive(index);
  };

  const handleTouchStart = (e) => {
    if (anim || count < 2) return;
    const t = e.touches[0];
    drag.current = {
      tracking: true,
      locked: false,
      startX: t.clientX,
      startY: t.clientY,
      lastX: t.clientX,
      lastT: e.timeStamp,
      speed: 0,
      dx: 0,
      width: viewportRef.current?.offsetWidth ?? 0,
    };
  };

  const handleTouchMove = (e) => {
    const d = drag.current;
    if (!d.tracking) return;
    const t = e.touches[0];
    const dx = t.clientX - d.startX;
    const dy = t.clientY - d.startY;

    // Пока палец почти не сдвинулся — решаем рано. Дальше определяем направление жеста:
    // вертикальный — это прокрутка страницы (не мешаем), горизонтальный — листаем фото.
    if (!d.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        d.tracking = false;
        return;
      }
      d.locked = true;
    }

    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.speed = (t.clientX - d.lastX) / dt;
    d.lastX = t.clientX;
    d.lastT = e.timeStamp;
    d.dx = Math.max(-d.width, Math.min(d.width, dx));
    setOffset(d.dx);
  };

  const handleTouchEnd = () => {
    const d = drag.current;
    const wasDragging = d.tracking && d.locked;
    d.tracking = false;
    if (!wasDragging) return;

    const far = Math.abs(d.dx) > d.width * SWIPE_DISTANCE_RATIO;
    const fast = Math.abs(d.speed) > SWIPE_FAST_SPEED && Math.abs(d.dx) > 16;
    if (far || fast) slideTo(d.dx < 0 ? 1 : -1);
    else springBack();
  };

  const shownActive = anim ? targetIndex : current;

  return (
    <div className="gallery">
      <div className="gallery-main">
        <button
          type="button"
          className="gallery-arrow left"
          aria-label="Предыдущее фото"
          onClick={() => slideTo(-1)}
        >
          ←
        </button>

        <div
          ref={viewportRef}
          className={`gallery-image${anim ? ' is-animating' : ''}`}
          style={{ aspectRatio: ratio }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div
            className="gallery-track"
            style={{
              transform: `translate3d(calc(-100% + ${offset}px), 0, 0)`,
              transition: anim ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 0.8, 0.3, 1)` : 'none',
            }}
          >
            {[prevIndex, current, nextIndex].map((index, pos) => {
              const src = slots[index];
              return (
                <div
                  key={pos}
                  className={`gallery-slide${src && ratios[src] ? ' is-loaded' : ''}`}
                  style={src ? { backgroundImage: `url(${src})` } : undefined}
                />
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="gallery-arrow right"
          aria-label="Следующее фото"
          onClick={() => slideTo(1)}
        >
          →
        </button>
      </div>

      <div className="gallery-thumbs">
        {slots.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`gallery-thumb${i === shownActive ? ' active' : ''}`}
            style={src ? { backgroundImage: `url(${src})` } : undefined}
            onClick={() => goTo(i)}
            aria-label={`Показать фото ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}