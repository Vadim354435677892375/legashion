import './Products.css';
import { useProducts } from '../../../../hooks/useProducts';
import ProductCard from '../../../../components/ProductCard';

// Блок «Товары» — сетка карточек 2 в ряд.
// Данные приходят с бэкенда (GET /api/products?collection=home), заменяя
// прежний захардкоженный homeProducts.js — карточка товара ведёт на
// /product/:id по реальному id из БД.
// Сама карточка (фото со свайпом, название, цена) — общий компонент
// components/ProductCard.jsx, используется так же на других страницах.
export default function Products() {
  const { products, loading, error } = useProducts('home');

  if (loading) return null;
  if (error) return <p className="products-error">Не удалось загрузить товары</p>;

  return (
    <div className="products">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}