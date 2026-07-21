import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductPage.css';
import Gallery from './blocks/gallery/Gallery';
import SystemMessage from './blocks/system-message/SystemMessage';
import OrderBlock from './blocks/order/OrderBlock';

// Страница «Карточка товара».
// images: пути к фото товара для галереи (сейчас — плейсхолдеры, [] пока фото нет).
// details: текст для окна System message (плотность, состав ткани и т.п.)
const PRODUCT = {
  images: [],
  details: {
    density: '—',
    composition: '—',
  },
};

export default function ProductPage() {
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = () => setCartCount((c) => c + 1);

  return (
    <div className="product-page">
      <Link className="product-back" to="/home">
        ← назад
      </Link>

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