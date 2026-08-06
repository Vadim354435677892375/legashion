import { Link, useParams } from 'react-router-dom';
import './CollectionPage.css';
import logo from '../../assets/logo-glitch.gif';
import CartButton from '../../components/CartButton';
import { COLLECTIONS } from './collectionItems';

// Страница отдельной коллекции (открывается по клику на карточку в блоке
// «Категории» на главной). Archive вынесен в свою собственную страницу
// (pages/archive_page/ArchivePage.jsx) — здесь остаются коллекции без
// отдельного файла, различаются заголовком и набором товаров.
// Данные — в collectionItems.js (общие с ProductPage).

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

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

export default function CollectionPage() {
  const { slug } = useParams();
  const collection = COLLECTIONS[slug] ?? COLLECTIONS['new-collection'];

  return (
    <div className="collection-page">
      <Link className="collection-back-top" to="/home">
        ← назад
      </Link>

      <header className="collection-header">
        <div className="collection-logo">
          <img src={logo} alt="LEGASHION" />
        </div>
        <h1 className="collection-title">{collection.title}</h1>
      </header>

      <MarqueeBar text={collection.marquee} />

      <div className="collection-banner">
        <div className="collection-banner-placeholder">
          <span className="collection-banner-play" />
          <span className="collection-banner-text">Промо-видео коллекции скоро</span>
        </div>
      </div>

      <MarqueeBar text={collection.marquee} />

      <div className="collection-grid">
        {collection.items.map(({ name, price, image }, i) => (
          <Link
            className="collection-card"
            to={`/product/${slug}-${i}`}
            key={`${name}-${i}`}
          >
            <div
              className="collection-card-image"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
            />
            <div className="collection-card-info">
              <div className="collection-card-name">{name}</div>
              <div className="collection-card-price">{formatPrice(price)}</div>
            </div>
          </Link>
        ))}
      </div>

      <Link className="collection-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}