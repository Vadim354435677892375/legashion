import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/pricing';

// ЕДИНАЯ карточка товара — используется на всех страницах со списками
// товаров (главная, коллекции, Sale, Tshirts, Archive) вместо того, чтобы
// одна и та же вёрстка (фото + название + цена + ссылка) была скопирована
// в каждую страницу по отдельности. Меняем поведение/стиль карточки —
// меняем один этот файл, а не 5 разных.
//
// Фото листается свайпом на сенсорных экранах (актуально в адаптиве): за пальцем едет
// «дорожка» из трёх слайдов (предыдущее, текущее, следующее), при отпускании фото доезжает
// до места с анимацией или возвращается назад, если протянули слишком мало. Листание по кругу.
// На десктопе свайп просто не срабатывает, ничего не ломая.
//
// Стили карточки живут прямо здесь и один раз вставляются в <head> при
// первой загрузке модуля — отдельный .css-файл для карточки не нужен.

const STYLE_ID = 'product-card-styles';

const CSS = `
.pc-card {
  display: block;
  text-decoration: none;
  border: 2px solid #6b6b6b;
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pc-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.45);
}

.pc-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #c7c7c7;
  background-size: cover;
  background-position: center;
  border-bottom: 2px solid #6b6b6b;
  -webkit-tap-highlight-color: transparent;
  /* горизонтальные жесты — наши (листаем фото), вертикальные — прокрутка страницы */
  touch-action: pan-y;
}

/* Дорожка со слайдами (предыдущее / текущее / следующее): едет за пальцем при свайпе */
.pc-track {
  position: absolute;
  inset: 0;
  display: flex;
  will-change: transform;
}

.pc-slide {
  flex: 0 0 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.pc-slide.is-loaded {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .pc-slide {
    transition: none;
  }
}

.pc-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #d92b2b;
  color: #fff;
  font-family: var(--font-main);
  font-size: 10px;
  letter-spacing: 0.02em;
  padding: 3px 6px;
  border-radius: 2px;
  z-index: 1;
}

.pc-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  z-index: 1;
}

.pc-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(0, 0, 0, 0.25);
  transition: background 0.15s ease, transform 0.15s ease;
}

.pc-dot.active {
  background: #0a0a0a;
  transform: scale(1.2);
}

.pc-info {
  background: #a9a9a9;
  padding: 8px 6px;
  text-align: center;
}

.pc-name {
  font-family: var(--font-main);
  font-size: 11px;
  letter-spacing: 0.02em;
  line-height: 1.5;
  color: #c98a2e;
}

.pc-price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-main);
  font-size: 11px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}

.pc-price-old {
  color: #7a7a7a;
  text-decoration: line-through;
}

.pc-price-new {
  color: #1e6fd9;
  font-weight: 700;
}

@media (max-width: 480px) {
  .pc-name,
  .pc-price {
    font-size: 10px;
  }
}
`;

if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const styleTag = document.createElement('style');
  styleTag.id = STYLE_ID;
  styleTag.textContent = CSS;
  document.head.appendChild(styleTag);
}

// Длительность перелистывания фото, мс (таймер завершения держится чуть дольше самой анимации).
const SLIDE_MS = 300;

// Доля ширины, на которую нужно протянуть фото, чтобы оно перелистнулось (иначе вернётся назад),
// и порог «быстрого щелчка» пальцем (px/мс), при котором хватает короткого движения.
const SWIPE_DISTANCE_RATIO = 0.2;
const SWIPE_FAST_SPEED = 0.4;

const mod = (i, n) => ((i % n) + n) % n;

/**
 * @param {string} id — id товара, ведёт на /product/:id
 * @param {string} name
 * @param {number} price — цена к показу (для Sale — уже со скидкой)
 * @param {number} [oldPrice] — зачёркнутая цена до скидки, если есть
 * @param {string[]} images — фото товара, первое показывается по умолчанию
 * @param {string} [badgeText] — текст плашки в углу фото, например «- 20%»
 */
export default function ProductCard({ id, name, price, oldPrice, images = [], badgeText }) {
  const slots = images.length > 0 ? images : [null];
  const count = slots.length;

  const [active, setActive] = useState(0);
  // Смещение дорожки за пальцем, px. 0 — текущее фото ровно по центру.
  const [offset, setOffset] = useState(0);
  // Пока идёт анимация: { dir: 1 | -1 } — вперёд/назад, { dir: 0 } — возврат на место.
  const [anim, setAnim] = useState(null);
  // Соседние фото подгружаем не сразу, а когда карточка попала на экран или её тронули —
  // чтобы страница со множеством карточек не качала лишние картинки на старте.
  const [armed, setArmed] = useState(false);
  // Фото, которые уже загрузились: { [src]: true } — слайд проявляется, когда его фото готово.
  const [loaded, setLoaded] = useState({});

  const cardRef = useRef(null);
  const viewportRef = useRef(null);
  const timerRef = useRef(null);
  const drag = useRef({ tracking: false, locked: false });
  const wasSwiped = useRef(false);

  const current = mod(active, count);
  const prevIndex = mod(current - 1, count);
  const nextIndex = mod(current + 1, count);

  const srcOf = (index) => (index === current || armed ? slots[index] : null);
  const trackSrcs = [srcOf(prevIndex), srcOf(current), srcOf(nextIndex)];

  useEffect(() => {
    if (count < 2) return undefined;
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setArmed(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  // Загружаем показываемые фото и отмечаем их готовыми (слайд тогда плавно проявляется).
  const wantedKey = [...new Set(trackSrcs.filter(Boolean))].join('\n');
  useEffect(() => {
    let cancelled = false;
    const list = wantedKey ? wantedKey.split('\n') : [];
    list.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setLoaded((prev) => (prev[src] ? prev : { ...prev, [src]: true }));
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [wantedKey]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

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

  const handleTouchStart = (e) => {
    wasSwiped.current = false;
    if (anim || count < 2) return;
    setArmed(true);
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

    // Сначала определяем направление жеста: вертикальный — это прокрутка страницы
    // (не мешаем), горизонтальный — листаем фото.
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

    // Карточка целиком — это <Link>: после горизонтального жеста гасим следующий click,
    // чтобы листание фото не открывало товар.
    wasSwiped.current = true;

    const far = Math.abs(d.dx) > d.width * SWIPE_DISTANCE_RATIO;
    const fast = Math.abs(d.speed) > SWIPE_FAST_SPEED && Math.abs(d.dx) > 16;
    if (far || fast) slideTo(d.dx < 0 ? 1 : -1);
    else springBack();
  };

  const handleClickCapture = (e) => {
    if (wasSwiped.current) {
      e.preventDefault();
      e.stopPropagation();
      wasSwiped.current = false;
    }
  };

  const shownActive = anim ? mod(current + anim.dir, count) : current;

  return (
    <Link ref={cardRef} className="pc-card" to={`/product/${id}`}>
      <div
        ref={viewportRef}
        className="pc-image"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        <div
          className="pc-track"
          style={{
            transform: `translate3d(calc(-100% + ${offset}px), 0, 0)`,
            transition: anim ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 0.8, 0.3, 1)` : 'none',
          }}
        >
          {trackSrcs.map((src, pos) => (
            <div
              key={pos}
              className={`pc-slide${src && loaded[src] ? ' is-loaded' : ''}`}
              style={src ? { backgroundImage: `url(${src})` } : undefined}
            />
          ))}
        </div>

        {badgeText && <span className="pc-badge">{badgeText}</span>}

        {count > 1 && (
          <div className="pc-dots" aria-hidden="true">
            {slots.map((_, i) => (
              <span key={i} className={`pc-dot${i === shownActive ? ' active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="pc-info">
        <div className="pc-name">{name}</div>
        <div className="pc-price">
          {oldPrice != null && <span className="pc-price-old">{formatPrice(oldPrice)}</span>}
          <span className={oldPrice != null ? 'pc-price-new' : undefined}>
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </Link>
  );
}