import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './blocks/cart-item/CartItem';
import CartSummary from './blocks/summary/CartSummary';
import './CartPage.css';

// Страница «Корзина». Данные берутся из общего CartContext (см. src/context/CartContext.jsx),
// поэтому товары, добавленные на странице товара, реально отображаются здесь.
export default function CartPage() {
  const { items, updateQty, removeItem, totalPrice } = useCart();

  return (
    <div className="cart-page">
      <Link className="cart-back" to="/home">
        ← назад
      </Link>

      <h1 className="cart-title">корзина</h1>

      {items.length === 0 ? (
        <p className="cart-empty">Корзина пуста. Загляните в каталог, чтобы что-нибудь выбрать.</p>
      ) : (
        <>
          <div className="cart-table-head">
            <span>товар</span>
            <span>количество</span>
            <span>всего</span>
          </div>

          <div className="cart-list">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQtyChange={updateQty}
                onRemove={removeItem}
              />
            ))}
          </div>

          <CartSummary totalPrice={totalPrice} />
        </>
      )}
    </div>
  );
}