import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './SalePage.css';
import cartIcon from '../../assets/icons/cart-icon.png';

// Страница «Sale» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page. Открывается по клику на карточку Sale в блоке
// «Категории» на главной (маршрут /sale).
// discount — процент скидки, показывается в красном бейдже на карточке.
// Когда появится реальный каталог товаров со скидкой — заменить ITEMS ниже.

const ITEMS = [
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
];

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function SalePage() {
  const { totalCount } = useCart();

  return (
    <div className="sale-page">
      <div className="sale-tape" aria-hidden="true" />

      <Link className="sale-back-top" to="/home">
        ← назад
      </Link>

      <header className="sale-header">
        <h1 className="sale-title">SALE</h1>
      </header>

      <div className="sale-grid">
        {ITEMS.map(({ name, price, discount, image }, i) => {
          const discounted = Math.round(price * (1 - discount / 100));
          return (
            <Link
              className="sale-card"
              to={`/product/sale-${i}`}
              key={`${name}-${i}`}
            >
              <div
                className="sale-card-image"
                style={image ? { backgroundImage: `url(${image})` } : undefined}
              >
                <span className="sale-badge">- {discount}%</span>
              </div>
              <div className="sale-card-info">
                <div className="sale-card-name">{name}</div>
                <div className="sale-card-price">
                  <span className="sale-card-price-old">{formatPrice(price)}</span>
                  <span className="sale-card-price-new">{formatPrice(discounted)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Link className="sale-back" to="/home">
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
        {totalCount > 0 && <span className="sale-cart-count">{totalCount}</span>}
      </Link>
    </div>
  );
}