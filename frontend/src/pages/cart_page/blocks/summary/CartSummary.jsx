import { Link } from 'react-router-dom';
import './CartSummary.css';

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}₽`;
}

// Блок «Итог»: сумма без скидки и доставки + переход на оформление заказа.
export default function CartSummary({ totalPrice }) {
  return (
    <div className="cart-summary">
      <div className="cart-summary-total">
        <span className="cart-summary-label">итог:</span>
        <span className="cart-summary-price">{formatPrice(totalPrice)}</span>
        <span className="cart-summary-note">без учёта скидки и доставки</span>
      </div>

      <Link to="/checkout" className="cart-summary-btn">
        оформить заказ
      </Link>
    </div>
  );
}