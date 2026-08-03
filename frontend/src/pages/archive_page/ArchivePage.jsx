import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ArchivePage.css';
import logo from '../../assets/logo-glitch.gif';
import cartIcon from '../../assets/icons/cart-icon.png';

// Страница коллекции «Archive» — отдельная страница в файловой системе,
// по аналогии с pages/collection_page. Открывается по клику на карточку
// Archive в блоке «Категории» на главной (маршрут /archive).
// Когда появится реальный каталог архивных вещей — заменить ITEMS ниже.

const ITEMS = [
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
];

// Число слайдов в баннере-карусели. Пока фото нет — слайды пустые серые
// плейсхолдеры; когда появятся фото архива, сюда нужно будет передать
// реальный список image-путей вместо slideCount.
const BANNER_SLIDE_COUNT = 4;

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

// Бегущая строка по чёрной полосе. Текст повторяется несколько раз внутри
// одного трека — так при бесконечной прокрутке на 50% ширины не видно шва.
function MarqueeBar({ text }) {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="archive-marquee-bar">
      <div className="archive-marquee-track">
        {items.map((i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}

// Баннер-карусель: стрелки листают слайды, точки под баннером показывают
// текущий слайд и позволяют перейти напрямую. Фото пока нет — вместо них
// пустые серые плейсхолдеры.
function BannerCarousel({ slideCount }) {
  const [index, setIndex] = useState(0);
  const slides = Array.from({ length: slideCount }, (_, i) => i);

  const prev = () => setIndex((i) => (i - 1 + slideCount) % slideCount);
  const next = () => setIndex((i) => (i + 1) % slideCount);

  return (
    <>
      <div className="archive-banner">
        <button
          type="button"
          className="archive-carousel-arrow archive-carousel-arrow--left"
          aria-label="Предыдущее фото"
          onClick={prev}
        >
          ←
        </button>

        <div className="archive-carousel-viewport">
          {slides.map((i) => (
            <div
              key={i}
              className="archive-carousel-slide"
              style={{ transform: `translateX(${(i - index) * 100}%)` }}
            />
          ))}
        </div>

        <button
          type="button"
          className="archive-carousel-arrow archive-carousel-arrow--right"
          aria-label="Следующее фото"
          onClick={next}
        >
          →
        </button>
      </div>

      <div className="archive-carousel-dots">
        {slides.map((i) => (
          <button
            key={i}
            type="button"
            className={`archive-carousel-dot${i === index ? ' active' : ''}`}
            aria-label={`Слайд ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </>
  );
}

export default function ArchivePage() {
  const { totalCount } = useCart();

  return (
    <div className="archive-page">
      <Link className="archive-back-top" to="/home">
        ← назад
      </Link>

      <header className="archive-header">
        <div className="archive-logo">
          <img src={logo} alt="LEGASHION" />
        </div>
        <h1 className="archive-title">ARCHIVE</h1>
      </header>

      <MarqueeBar text="ARCHIVE" />

      <BannerCarousel slideCount={BANNER_SLIDE_COUNT} />

      <MarqueeBar text="ARCHIVE" />

      <div className="archive-grid">
        {ITEMS.map(({ name, price, image }, i) => (
          <Link
            className="archive-card"
            to={`/product/archive-${i}`}
            key={`${name}-${i}`}
          >
            <div
              className="archive-card-image"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
            />
            <div className="archive-card-info">
              <div className="archive-card-name">{name}</div>
              <div className="archive-card-price">{formatPrice(price)}</div>
            </div>
          </Link>
        ))}
      </div>

      <Link className="archive-back" to="/home">
        вернуться на главную
      </Link>

      <Link
        to="/cart"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '100px',
          zIndex: 1000,
        }}
      >
        <img
          src={cartIcon}
          alt="Корзина"
          style={{
            width: '60px',
            height: 'auto',
            cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))',
          }}
        />
        {totalCount > 0 && <span className="archive-cart-count">{totalCount}</span>}
      </Link>
    </div>
  );
}