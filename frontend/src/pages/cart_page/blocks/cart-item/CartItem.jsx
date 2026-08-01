import './CartItem.css';

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}₽`;
}

// Строка товара в корзине.
// item: { id, name, image, size, price, qty }
// onQtyChange(id, qty), onRemove(id)
export default function CartItem({ item, onQtyChange, onRemove }) {
  const decrease = () => onQtyChange(item.id, item.qty - 1);
  const increase = () => onQtyChange(item.id, item.qty + 1);

  return (
    <div className="cart-item">
      <div className="cart-item-product">
        <div className="cart-item-image">
          {item.image ? (
            <img src={item.image} alt={item.name} />
          ) : (
            <span className="cart-item-image-placeholder">фото</span>
          )}
        </div>
        <div className="cart-item-info">
          <div className="cart-item-name">{item.name}</div>
          {item.size && (
            <div className="cart-item-size">
              размер: <b>{item.size}</b>
            </div>
          )}
          <button type="button" className="cart-item-remove" onClick={() => onRemove(item.id)}>
            убрать
          </button>
        </div>
      </div>

      <div className="cart-item-qty">
        <button
          type="button"
          className="cart-item-qty-btn"
          onClick={decrease}
          disabled={item.qty <= 1}
          aria-label="Уменьшить количество"
        >
          −
        </button>
        <span className="cart-item-qty-value">{item.qty}</span>
        <button
          type="button"
          className="cart-item-qty-btn"
          onClick={increase}
          aria-label="Увеличить количество"
        >
          +
        </button>
      </div>

      <div className="cart-item-total">{formatPrice(item.price * item.qty)}</div>
    </div>
  );
}