import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { apiGet } from '../../utils/api';
import { getDiscountedPrice } from '../../utils/pricing';
import './ProductPage.css';
import Gallery from './blocks/gallery/Gallery';
import SystemMessage from './blocks/system-message/SystemMessage';

// Страница «Карточка товара» — товар загружается с бэкенда по числовому id
// (GET /api/products/:id). Раньше id был вида "sale-0"/"archive-2"/... и
// резолвился по префиксу в один из захардкоженных списков (SOURCES) — теперь,
// когда каталог живёт в БД, у товара всегда один настоящий id, из какой бы
// коллекции на него ни перешли.
export default function ProductPage() {
  const { id } = useParams();
  const { addItem, totalCount } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);

    apiGet(`/api/products/${id}`, { signal: controller.signal })
      .then(setProduct)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 404) {
          setNotFound(true);
        } else {
          console.error(err);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  // Возвращаемся туда, откуда пришли (главная, страница коллекции и т.д.),
  // а не всегда на /home. Если истории нет (открыли ссылку напрямую) —
  // всё равно уводим на главную, чтобы не остаться на пустом экране.
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  const handleAddToCart = (size) => {
    if (!product) return;
    const finalPrice = product.discountPercent
      ? getDiscountedPrice(product.price, product.discountPercent)
      : product.price;

    addItem({
      id: `${product.id}-${size}`,
      name: product.name,
      size,
      price: finalPrice,
      discount: product.discountPercent || undefined,
      qty: 1,
    });
  };

  return (
    <div className="product-page">
      <button type="button" className="product-back" onClick={goBack}>
        ← назад
      </button>

      <Link className="product-cart-indicator" to="/cart">
        <span>в корзину</span>
        {totalCount > 0 && <span className="product-cart-count">{totalCount}</span>}
      </Link>

      {notFound && <p className="product-not-found">Товар не найден</p>}

      {!notFound && (
        <>
          <Gallery images={product?.images ?? []} />
          <SystemMessage
            details={{ density: product?.density ?? '—', composition: product?.composition ?? '—' }}
            onAddToCart={handleAddToCart}
          />
        </>
      )}

      {loading && <p className="product-loading">Загрузка…</p>}
    </div>
  );
}
