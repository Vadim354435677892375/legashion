import { Link } from 'react-router-dom';
import './SalePage.css';
import CartButton from '../../components/CartButton';
import { SALE_ITEMS, getDiscountedPrice } from './saleItems';

// Страница «Sale» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page. Открывается по клику на карточку Sale в блоке
// «Категории» на главной (маршрут /sale).
// Данные товаров — в saleItems.js (общие с ProductPage, чтобы цена и
// скидка совпадали).

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function SalePage() {
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
        {SALE_ITEMS.map(({ name, price, discount, image }, i) => {
          const discounted = getDiscountedPrice(price, discount);
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

      <CartButton />
    </div>
  );
}