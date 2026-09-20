import { Link } from 'react-router-dom';
import './TshirtsPage.css';
import CartButton from '../../components/CartButton';
import { useProducts } from '../../hooks/useProducts';
import { useSiteMedia } from '../../hooks/useSiteMedia';
import { formatPrice } from '../../utils/pricing';

// Страница «Футболки» — отдельная страница в файловой системе, по аналогии
// с pages/archive_page и pages/sale_page. Открывается по клику на карточку
// «Футболки» в блоке «Категории» на главной (маршрут /tshirts).
// Крупное фото футболки сверху страницы загружается в админке (слот tshirts.hero);
// пока его нет — плейсхолдер.
// Товары сетки приходят с бэкенда (GET /api/products?collection=tshirts).

export default function TshirtsPage() {
  const { products, loading, error } = useProducts('tshirts');
  const heroImage = useSiteMedia().get('tshirts.hero');

  return (
    <div className="tshirts-page">
      <Link className="tshirts-back-top" to="/home">
        ← назад
      </Link>

      <div
        className="tshirts-hero"
        style={heroImage ? { backgroundImage: `url(${heroImage})` } : undefined}
      />

      {error && <p className="tshirts-error">Не удалось загрузить товары</p>}

      {!loading && !error && (
        <div className="tshirts-grid">
          {products.map(({ id, name, price, images }) => (
            <Link className="tshirts-card" to={`/product/${id}`} key={id}>
              <div
                className="tshirts-card-image"
                style={images[0] ? { backgroundImage: `url(${images[0]})` } : undefined}
              />
              <div className="tshirts-card-info">
                <div className="tshirts-card-name">{name}</div>
                <div className="tshirts-card-price">{formatPrice(price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link className="tshirts-back" to="/home">
        вернуться на главную
      </Link>

      <CartButton />
    </div>
  );
}
