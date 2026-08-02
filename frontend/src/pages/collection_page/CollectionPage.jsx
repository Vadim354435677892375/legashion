import { Link, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CollectionPage.css';
import cartIcon from '../../assets/icons/cart-icon.png';

// Страница отдельной коллекции (открывается по клику на карточку в блоке
// «Категории» на главной — New Collection / Archive / Sale).
// Пока это одна и та же вёрстка для всех коллекций, различается только
// заголовок и набор товаров. Когда появится реальный каталог — items нужно
// будет брать по slug из данных коллекции, а не из константы ниже.

const COLLECTIONS = {
  'new-collection': {
    title: 'NEW COLLECTION',
    items: [
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
    ],
  },
};

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function CollectionPage() {
  const { slug } = useParams();
  const { totalCount } = useCart();
  const collection = COLLECTIONS[slug] ?? COLLECTIONS['new-collection'];

  return (
    <div className="collection-page">
      <Link className="collection-back-top" to="/home">
        ← назад
      </Link>

      <h1 className="collection-title">{collection.title}</h1>

      <div className="collection-banner" />

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
        {totalCount > 0 && <span className="collection-cart-count">{totalCount}</span>}
      </Link>
    </div>
  );
}