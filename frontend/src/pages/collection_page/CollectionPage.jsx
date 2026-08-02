import { Link, useParams } from 'react-router-dom';
import './CollectionPage.css';
import logo from '../../assets/logo-glitch.gif';
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
  const collection = COLLECTIONS[slug] ?? COLLECTIONS['new-collection'];

  return (
    <div className="collection-page">
      <div className="collection-frame">
        <header className="collection-header">
          <div className="collection-logo">
            <img src={logo} alt="LEGASHION" />
          </div>
          <h1 className="collection-title">{collection.title}</h1>
        </header>

        <div className="collection-divider" />

        <div className="collection-banner">
          <span className="collection-photo collection-photo--top" />
          <span className="collection-photo collection-photo--bottom" />
        </div>

        <div className="collection-divider" />

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
      </div>

      <Link to="/cart" className="collection-cart-icon">
        <img src={cartIcon} alt="Корзина" />
      </Link>
    </div>
  );
}