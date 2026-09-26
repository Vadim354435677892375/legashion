import { Link } from 'react-router-dom';
import './SalePage.css';
import CartButton from '../../components/CartButton';
import ProductCard from '../../components/ProductCard';
import { useProducts } from '../../hooks/useProducts';
import { getDiscountedPrice } from '../../utils/pricing';

// Страница «Sale» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page. Открывается по клику на карточку Sale в блоке
// «Категории» на главной (маршрут /sale).
// Товары приходят с бэкенда (GET /api/products?collection=sale), заменяя
// прежний захардкоженный saleItems.js.
// Карточка (фото со свайпом, название, цена/скидка) — общий компонент
// components/ProductCard.jsx, используется так же на других страницах.

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
          {products.map(({ id, name, price, discountPercent, images }) => (
            <ProductCard
              key={id}
              id={id}
              name={name}
              images={images}
              price={getDiscountedPrice(price, discountPercent)}
              oldPrice={discountPercent > 0 ? price : undefined}
              badgeText={discountPercent > 0 ? `- ${discountPercent}%` : undefined}
            />
          ))}
        </div>
      )}

      <Link className="sale-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}