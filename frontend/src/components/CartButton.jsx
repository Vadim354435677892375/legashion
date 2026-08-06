import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import cartIcon from '../assets/icons/cart-icon.png';

// Плавающая кнопка «Корзина» — используется на всех страницах магазина
// (главная, Sale, Archive, Футболки, коллекции и т.д.), чтобы код иконки
// не дублировался в каждом файле. Всегда в правом нижнем углу экрана,
// поверх контента; показывает количество товаров, если корзина не пуста.
export default function CartButton() {
  const { totalCount } = useCart();

  return (
    <Link
      to="/cart"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '100px',
        zIndex: 1000,
      }}
    >
      <img
        src={cartIcon}
        alt="Корзина"
        style={{
          width: '60px',
          height: 'auto',
          cursor: 'pointer',
          filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))',
        }}
      />
      {totalCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '20px',
            height: '20px',
            padding: '0 5px',
            borderRadius: '50%',
            background: '#163a7a',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          {totalCount}
        </span>
      )}
    </Link>
  );
}