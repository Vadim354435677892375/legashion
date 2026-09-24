import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCachedGet } from '../../hooks/useCachedGet';
import { getDiscountedPrice } from '../../utils/pricing';
import { flyToCart } from '../../utils/flyToCart';
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

  // Товар берётся из общего кэша: если его уже открывали, страница показывается мгновенно
  const { data: product, loading, error } = useCachedGet(`/api/products/${id}`);
  const notFound = error?.status === 404;

  useEffect(() => {
    if (error && error.status !== 404) console.error(error);
  }, [error]);

  // Число в красном кружке. Обновляется не сразу, а когда красная точка
  // «долетела» до корзины — так появление кружка выглядит как результат полёта.
  const [shownCount, setShownCount] = useState(totalCount);
  const indicatorRef = useRef(null);
  const flightsRef = useRef(0);
  const totalRef = useRef(totalCount);
  totalRef.current = totalCount;

  useEffect(() => {
    if (flightsRef.current === 0) setShownCount(totalCount);
  }, [totalCount]);

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

  const handleAddToCart = (size, buttonEl) => {
    if (!product) return;
    const finalPrice = product.discountPercent
      ? getDiscountedPrice(product.price, product.discountPercent)
      : product.price;

    addItem({
      id: `${product.id}-${size}`,
      productId: product.id, // по нему бэкенд сам берёт актуальную цену при оформлении заказа
      name: product.name,
      image: product.images?.[0], // первое фото товара — для миниатюры в корзине
      size,
      price: finalPrice,
      discount: product.discountPercent || undefined,
      qty: 1,
    });

    // Точка полёта: место, где появляется красный кружок (правый верхний угол ссылки)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = indicatorRef.current?.getBoundingClientRect();
    if (reduceMotion || !buttonEl || !target) return;

    flightsRef.current += 1;
    flyToCart(buttonEl, { x: target.right + 3, y: target.top - 1 }).then(() => {
      flightsRef.current -= 1;
      if (flightsRef.current === 0) setShownCount(totalRef.current);
      else setShownCount((c) => c + 1);
    });
  };

  return (
    <div className="product-page">
      <button type="button" className="product-back" onClick={goBack}>
        ← назад
      </button>

      <Link ref={indicatorRef} className="product-cart-indicator" to="/cart">
        {/* Ключ заставляет надпись «подпрыгнуть» при каждом приземлении точки */}
        <span key={`label-${shownCount}`} className={shownCount > 0 ? 'product-cart-label bump' : 'product-cart-label'}>
          в корзину
        </span>
        {/* key={shownCount} перемонтирует кружок при каждом изменении числа —
            так анимация «выскакивания» проигрывается заново при каждом добавлении */}
        {shownCount > 0 && (
          <span key={shownCount} className="product-cart-count">
            <span className="product-cart-count-num">{shownCount}</span>
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className="product-cart-spark" style={{ '--a': `${i * 45}deg` }} />
            ))}
          </span>
        )}
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