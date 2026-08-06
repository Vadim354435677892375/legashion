import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductPage.css';
import Gallery from './blocks/gallery/Gallery';
import SystemMessage from './blocks/system-message/SystemMessage';
import OrderBlock from './blocks/order/OrderBlock';
import { SALE_ITEMS, getDiscountedPrice } from '../sale_page/saleItems';
import { TSHIRT_ITEMS } from '../tshirts_page/tshirtItems';

// Страница «Карточка товара».
// images: пути к фото товара для галереи (сейчас — плейсхолдеры, [] пока фото нет).
// details: текст для окна System message (плотность, состав ткани и т.п.)
// Заглушка для товаров без своих данных (пока нет общего каталога).
const FALLBACK_PRODUCT = {
  name: 'Товар',
  price: 3000,
  discount: 0,
  images: [],
  details: {
    density: '—',
    composition: '—',
  },
};

// По :id определяем, что за товар открыт. Карточки Sale ведут на
// /product/sale-<индекс> (см. SalePage) — для них берём цену и скидку
// из общих данных saleItems.js, чтобы они совпадали со страницей Sale.
function resolveProduct(id) {
  if (id && id.startsWith('sale-')) {
    const index = Number(id.slice('sale-'.length));
    const item = SALE_ITEMS[index];
    if (item) {
      return {
        name: item.name,
        price: item.price,
        discount: item.discount,
        images: item.image ? [item.image] : [],
        details: FALLBACK_PRODUCT.details,
      };
    }
  }
  if (id && id.startsWith('tshirts-')) {
    const index = Number(id.slice('tshirts-'.length));
    const item = TSHIRT_ITEMS[index];
    if (item) {
      return {
        name: item.name,
        price: item.price,
        discount: 0,
        images: item.image ? [item.image] : [],
        details: FALLBACK_PRODUCT.details,
      };
    }
  }
  return FALLBACK_PRODUCT;
}

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const PRODUCT = resolveProduct(id);
  const finalPrice = PRODUCT.discount
    ? getDiscountedPrice(PRODUCT.price, PRODUCT.discount)
    : PRODUCT.price;

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
    setCartCount((c) => c + 1);
    addItem({
      id: `${id ?? PRODUCT.name}-${size}`,
      name: PRODUCT.name,
      size,
      price: finalPrice,
      discount: PRODUCT.discount || undefined,
      qty: 1,
    });
  };

  return (
    <div className="product-page">
      <button type="button" className="product-back" onClick={goBack}>
        ← назад
      </button>

      <div className="product-cart-indicator">
        <span>в корзину</span>
        {cartCount > 0 && <span className="product-cart-count">{cartCount}</span>}
      </div>

      <Gallery images={PRODUCT.images} />
      <SystemMessage details={PRODUCT.details} />
      <OrderBlock onAddToCart={handleAddToCart} />
    </div>
  );
}