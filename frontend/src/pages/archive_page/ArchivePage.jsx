import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ArchivePage.css';
import logo from '../../assets/logo-glitch.gif';
import CartButton from '../../components/CartButton';
import { ARCHIVE_ITEMS } from './archiveItems';

// Страница коллекции «Archive» — отдельная страница в файловой системе,
// по аналогии с pages/collection_page. Открывается по клику на карточку
// Archive в блоке «Категории» на главной (маршрут /archive).
// Данные товаров — в archiveItems.js (общие с ProductPage, чтобы название
// и цена совпадали).

// Число слайдов в баннере-карусели. Пока фото нет — слайды пустые серые
// плейсхолдеры; когда появятся фото архива, сюда нужно будет передать
// реальный список image-путей вместо slideCount.
const BANNER_SLIDE_COUNT = 4;

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
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

      <BannerCarousel slideCount={BANNER_SLIDE_COUNT} />

      <div className="archive-grid">
        {ARCHIVE_ITEMS.map(({ name, price, image }, i) => (
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

      <CartButton />
    </div>
  );
}