import { Link } from 'react-router-dom';
import './TshirtsPage.css';
import CartButton from '../../components/CartButton';
import { TSHIRT_ITEMS } from './tshirtItems';

// Страница «Футболки» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page и pages/sale_page. Открывается по клику на карточку
// «Футболки» в блоке «Категории» на главной (маршрут /tshirts).
// heroImage: крупное фото футболки сверху страницы — пока плейсхолдер,
// заменить на реальное фото, когда оно будет готово.
// Данные товаров сетки — в tshirtItems.js (общие с ProductPage).

const heroImage = null;

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function TshirtsPage() {
  return (
    <div className="tshirts-page">
      <Link className="tshirts-back-top" to="/home">
        ← назад
      </Link>

      <div
        className="tshirts-hero"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
      />

      <div className="tshirts-grid">
        {TSHIRT_ITEMS.map(({ name, price, image }, i) => (
          <Link
            className="tshirts-card"
            to={`/product/tshirts-${i}`}
            key={`${name}-${i}`}
          >
            <div
              className="tshirts-card-image"
              style={image ? { backgroundImage: `url(${image})` } : undefined}
            />
            <div className="tshirts-card-info">
              <div className="tshirts-card-name">{name}</div>
              <div className="tshirts-card-price">{formatPrice(price)}</div>
            </div>
          </Link>
        ))}
      </div>

      <Link className="tshirts-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}