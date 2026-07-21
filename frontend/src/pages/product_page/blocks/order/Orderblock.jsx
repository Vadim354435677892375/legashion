import { useState } from 'react';
import './OrderBlock.css';

const SIZES = ['S', 'M', 'L', 'XL'];

// Блок «Оформление» — выпадающий список размеров + кнопка добавления в корзину.
// onAddToCart(size): вызывается при клике на кнопку, наверх уходит выбранный размер.
export default function OrderBlock({ onAddToCart }) {
  const [size, setSize] = useState('M');

  return (
    <div className="order-block">
      <select
        className="order-size"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        aria-label="Размер"
      >
        {SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button type="button" className="order-add-btn" onClick={() => onAddToCart?.(size)}>
        в корзину
      </button>
    </div>
  );
}