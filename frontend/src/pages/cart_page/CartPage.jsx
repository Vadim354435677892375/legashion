import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './blocks/cart-item/CartItem';
import CartSummary from './blocks/summary/CartSummary';
import './CartPage.css';

// Страница «Корзина». Данные берутся из общего CartContext (см. src/context/CartContext.jsx),
// поэтому товары, добавленные на странице товара, реально отображаются здесь.
export default function CartPage() {
  const { items, updateQty, removeItem, totalPrice } = useCart();
  const navigate = useNavigate();

  // Закрытие корзины возвращает туда, откуда её открыли (карточка товара,
  // главная и т.д.), а не всегда на /home — так же, как «назад» на карточке
  // товара. Если истории нет (открыли ссылку напрямую) — уходим на главную.
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="cart-page">
      <button type="button" className="cart-back" onClick={goBack}>
        ← назад
      </button>

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