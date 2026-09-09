import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import cartIcon from '../assets/icons/cart-icon.png';
import './CartButton.css';

// Плавающая кнопка «Корзина» — используется на всех страницах магазина
// (главная, Sale, Archive, Футболки, коллекции и т.д.), чтобы код иконки
// не дублировался в каждом файле. Всегда в правом нижнем углу экрана,
// поверх контента; показывает количество товаров, если корзина не пуста.
export default function CartButton() {
  const { totalCount } = useCart();

  return (
    <Link to="/cart" className="cart-fab">
      <img src={cartIcon} alt="Корзина" className="cart-fab-icon" />
      {totalCount > 0 && <span className="cart-fab-count">{totalCount}</span>}
    </Link>
  );
}