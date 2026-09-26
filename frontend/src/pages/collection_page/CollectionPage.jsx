import { Link, useParams } from 'react-router-dom';
import './CollectionPage.css';
import defaultLogo from '../../assets/logo-glitch.gif';
import CartButton from '../../components/CartButton';
import { useCollection } from '../../hooks/useCollection';
import { useProducts } from '../../hooks/useProducts';
import { useSiteMedia } from '../../hooks/useSiteMedia';
import ProductCard from '../../components/ProductCard';

// Страница отдельной коллекции (открывается по клику на карточку в блоке
// «Категории» на главной). Archive вынесен в свою собственную страницу
// (pages/archive_page/ArchivePage.jsx) — здесь остаются коллекции без
// отдельного файла, различаются заголовком и набором товаров.
// Заголовок/marquee и товары теперь приходят с бэкенда (GET /api/collections/:slug
// и GET /api/products?collection=:slug) вместо прежнего collectionItems.js.

// Бегущая строка по чёрной полосе. Текст повторяется несколько раз внутри
// одного трека — так при бесконечной прокрутке на 50% ширины не видно шва.
function MarqueeBar({ text }) {
  const items = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {items.map((i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}

const FALLBACK_TITLE = 'NEW COLLECTION';

export default function CollectionPage() {
  const { slug = 'new-collection' } = useParams();
  const { collection } = useCollection(slug);
  const { products, loading, error } = useProducts(slug);
  const media = useSiteMedia();
  const logo = media.get('brand.logo', defaultLogo);

  const title = collection?.title ?? FALLBACK_TITLE;
  const marquee = collection?.marquee ?? title;

  return (
    <div className="collection-page">
      <Link className="collection-back-top" to="/home">
        ← назад
      </Link>

      <header className="collection-header">
        <div className="collection-logo">
          {logo && <img src={logo} alt="LEGASHION" />}
        </div>
        <h1 className="collection-title">{title}</h1>
      </header>

      <MarqueeBar text={marquee} />

      <div className="collection-banner">
        {collection?.bannerVideoUrl ? (
          // Промо-видео коллекции загружается в админке: Медиа → «Промо-видео коллекций».
          <video
            className="collection-banner-video"
            src={collection.bannerVideoUrl}
            poster={collection.bannerPosterUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="collection-banner-placeholder">
            <span className="collection-banner-play" />
            <span className="collection-banner-text">Промо-видео коллекции скоро</span>
          </div>
        )}
      </div>

      <MarqueeBar text={marquee} />

      {error && <p className="collection-error">Не удалось загрузить товары</p>}

      {!loading && !error && (
        <div className="collection-grid">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}

      <Link className="collection-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}