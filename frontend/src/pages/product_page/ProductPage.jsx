import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductPage.css';
import Gallery from './blocks/gallery/Gallery';
import SystemMessage from './blocks/system-message/SystemMessage';
import OrderBlock from './blocks/order/OrderBlock';

// Страница «Карточка товара».
// images: пути к фото товара для галереи (сейчас — плейсхолдеры, [] пока фото нет).
// details: текст для окна System message (плотность, состав ткани и т.п.)
// name/price: пока заглушки — когда появится каталог с реальными товарами,
// брать их нужно будет по :id из данных товара, а не из константы.
const PRODUCT = {
  name: 'Товар',
  price: 3000,
  images: [],
  details: {
    density: '—',
    composition: '—',
  },
};

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

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
      price: PRODUCT.price,
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