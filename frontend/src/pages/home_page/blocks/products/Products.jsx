import { Link } from 'react-router-dom';
import './Products.css';
import { useProducts } from '../../../../hooks/useProducts';
import { formatPrice } from '../../../../utils/pricing';

// Блок «Товары» — сетка карточек 2 в ряд.
// Данные приходят с бэкенда (GET /api/products?collection=home), заменяя
// прежний захардкоженный homeProducts.js — карточка товара ведёт на
// /product/:id по реальному id из БД.
export default function Products() {
  const { products, loading, error } = useProducts('home');

  if (loading) return null;
  if (error) return <p className="products-error">Не удалось загрузить товары</p>;

  return (
    <div className="products">
      {products.map(({ id, name, price, images }) => (
        <Link className="product-card" to={`/product/${id}`} key={id}>
          <div
            className="product-image"
            style={images[0] ? { backgroundImage: `url(${images[0]})` } : undefined}
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
