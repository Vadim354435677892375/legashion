import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ArchivePage.css';
import defaultLogo from '../../assets/logo-glitch.gif';
import CartButton from '../../components/CartButton';
import { useProducts } from '../../hooks/useProducts';
import { useSiteMedia } from '../../hooks/useSiteMedia';
import ProductCard from '../../components/ProductCard';
import FadeBg from '../../components/FadeBg';

// Страница коллекции «Archive» — отдельная страница в файловой системе,
// по аналогии с pages/collection_page. Открывается по клику на карточку
// Archive в блоке «Категории» на главной (маршрут /archive).
// Товары приходят с бэкенда (GET /api/products?collection=archive), заменяя
// прежний захардкоженный archiveItems.js.

// Слайды баннера-карусели. Фото загружаются в админке (Медиа → «Страница Archive»);
// слайд без фото остаётся серым плейсхолдером. Ключи слотов — backend/src/lib/mediaSlots.js.
const BANNER_SLOT_KEYS = ['archive.banner-1', 'archive.banner-2', 'archive.banner-3', 'archive.banner-4'];

// Баннер-карусель: стрелки листают слайды, точки под баннером показывают
// текущий слайд и позволяют перейти напрямую.
function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const media = useSiteMedia();
  const slideCount = BANNER_SLOT_KEYS.length;
  const slides = BANNER_SLOT_KEYS.map((key, i) => ({ i, image: media.get(key) }));

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
          {slides.map(({ i, image }) => (
            <FadeBg
              key={i}
              src={image}
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
        {slides.map(({ i }) => (
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
  const { products, loading, error } = useProducts('archive');
  const media = useSiteMedia();
  const logo = media.get('brand.logo', defaultLogo);

  return (
    <div className="archive-page">
      <Link className="archive-back-top" to="/home">
        ← назад
      </Link>

      <header className="archive-header">
        <div className="archive-logo">
          {logo && <img src={logo} alt="LEGASHION" />}
        </div>
        <h1 className="archive-title">ARCHIVE</h1>
      </header>

      <BannerCarousel />

      {error && <p className="archive-error">Не удалось загрузить товары</p>}

      {!loading && !error && (
        <div className="archive-grid">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}

      <Link className="archive-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}