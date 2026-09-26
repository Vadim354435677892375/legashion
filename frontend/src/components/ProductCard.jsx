import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/pricing';

// ЕДИНАЯ карточка товара — используется на всех страницах со списками
// товаров (главная, коллекции, Sale, Tshirts, Archive) вместо того, чтобы
// одна и та же вёрстка (фото + название + цена + ссылка) была скопирована
// в каждую страницу по отдельности. Меняем поведение/стиль карточки —
// меняем один этот файл, а не 5 разных.
//
// Фото можно листать свайпом на сенсорных экранах (актуально в адаптиве);
// на десктопе свайп просто не срабатывает, ничего не ломая.
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
  aspect-ratio: 1 / 1;
  background: #c7c7c7;
  background-size: cover;
  background-position: center;
  border-bottom: 2px solid #6b6b6b;
  -webkit-tap-highlight-color: transparent;
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

// Минимальное расстояние свайпа в пикселях, после которого считаем,
// что пользователь листает фото, а не просто задел карточку пальцем.
const SWIPE_THRESHOLD = 30;

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
  const [active, setActive] = useState(0);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const wasSwiped = useRef(false);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (slots.length > 1) {
      if (touchDeltaX.current <= -SWIPE_THRESHOLD) {
        setActive((i) => (i + 1) % slots.length);
        wasSwiped.current = true;
      } else if (touchDeltaX.current >= SWIPE_THRESHOLD) {
        setActive((i) => (i - 1 + slots.length) % slots.length);
        wasSwiped.current = true;
      }
    }
    touchDeltaX.current = 0;
  };

  // Карточка целиком — это <Link>. Если было движение пальцем (свайп),
  // гасим последующий click, чтобы смена фото не открывала товар.
  const handleClickCapture = (e) => {
    if (wasSwiped.current) {
      e.preventDefault();
      e.stopPropagation();
      wasSwiped.current = false;
    }
  };

  return (
    <Link className="pc-card" to={`/product/${id}`}>
      <div
        className="pc-image"
        style={slots[active] ? { backgroundImage: `url(${slots[active]})` } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        {badgeText && <span className="pc-badge">{badgeText}</span>}

        {slots.length > 1 && (
          <div className="pc-dots" aria-hidden="true">
            {slots.map((_, i) => (
              <span key={i} className={`pc-dot${i === active ? ' active' : ''}`} />
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