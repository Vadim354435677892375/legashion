import { Link } from 'react-router-dom';
import './SalePage.css';
import CartButton from '../../components/CartButton';
import { useProducts } from '../../hooks/useProducts';
import { formatPrice, getDiscountedPrice } from '../../utils/pricing';

// Страница «Sale» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page. Открывается по клику на карточку Sale в блоке
// «Категории» на главной (маршрут /sale).
// Товары приходят с бэкенда (GET /api/products?collection=sale), заменяя
// прежний захардкоженный saleItems.js.

export default function SalePage() {
  const { products, loading, error } = useProducts('sale');

  return (
    <div className="sale-page">
      <div className="sale-tape" aria-hidden="true" />

      <Link className="sale-back-top" to="/home">
        ← назад
      </Link>

      <header className="sale-header">
        <h1 className="sale-title">SALE</h1>
      </header>

      {error && <p className="sale-error">Не удалось загрузить товары</p>}

      {!loading && !error && (
        <div className="sale-grid">
          {products.map(({ id, name, price, discountPercent, images }) => {
            const discounted = getDiscountedPrice(price, discountPercent);
            return (
              <Link className="sale-card" to={`/product/${id}`} key={id}>
                <div
                  className="sale-card-image"
                  style={images[0] ? { backgroundImage: `url(${images[0]})` } : undefined}
                >
                  {discountPercent > 0 && <span className="sale-badge">- {discountPercent}%</span>}
                </div>
                <div className="sale-card-info">
                  <div className="sale-card-name">{name}</div>
                  <div className="sale-card-price">
                    {discountPercent > 0 && (
                      <span className="sale-card-price-old">{formatPrice(price)}</span>
                    )}
                    <span className="sale-card-price-new">{formatPrice(discounted)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Link className="sale-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}
