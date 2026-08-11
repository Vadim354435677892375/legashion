import { useState } from 'react';
import './SystemMessage.css';

const SIZES = ['S', 'M', 'L', 'XL'];

// Блок «System message» — окно в стиле классического Windows с характеристиками товара.
// details: { density: string, composition: string } — плотность и состав ткани.
// onAddToCart(size): вызывается при клике на кнопку «в корзину», наверх уходит выбранный размер.
// Выбор размера и кнопка «в корзину» находятся внутри этого же окна.
// Закрывается по крестику; повторно открыть можно кнопкой-заглушкой снизу.
export default function SystemMessage({ details = {}, onAddToCart }) {
  const [closed, setClosed] = useState(false);
  const [size, setSize] = useState('M');
  const { density = '—', composition = '—' } = details;

  if (closed) {
    return (
      <button type="button" className="sysmsg-reopen" onClick={() => setClosed(false)}>
        Показать характеристики товара
      </button>
    );
  }

  return (
    <div className="sysmsg">
      <div className="sysmsg-titlebar">
        <span className="sysmsg-title">System message</span>
        <button
          type="button"
          className="sysmsg-close"
          aria-label="Закрыть"
          onClick={() => setClosed(true)}
        >
          ×
        </button>
      </div>
      <div className="sysmsg-body">
        <p>плотность- {density}</p>
        <p>состав- {composition}</p>

        <div className="sysmsg-order">
          <select
            className="sysmsg-order-size"
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

          <button
            type="button"
            className="sysmsg-order-add-btn"
            onClick={() => onAddToCart?.(size)}
          >
            в корзину
          </button>
        </div>
      </div>
    </div>
  );
}