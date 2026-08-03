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

      <div className="archive-banner">
        <div className="archive-banner-placeholder">
          <span className="archive-banner-play" />
          <span className="archive-banner-text">Промо-видео коллекции скоро</span>
        </div>
      </div>

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