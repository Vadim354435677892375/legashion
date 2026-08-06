import { Link } from 'react-router-dom';
import './Products.css';
import { HOME_PRODUCTS } from './homeProducts';

// Блок «Товары» — сетка карточек 2 в ряд.
// Данные — в homeProducts.js (общие с ProductPage, чтобы название и цена
// совпадали).

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function Products() {
  return (
    <div className="products">
      {HOME_PRODUCTS.map(({ name, price, image }, i) => (
        <Link className="product-card" to={`/product/home-${i}`} key={`${name}-${i}`}>
          <div
            className="product-image"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
          <div className="product-info">
            <div className="product-name">{name}</div>
            <div className="product-price">{formatPrice(price)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}