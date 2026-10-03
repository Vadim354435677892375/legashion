import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SystemMessage.css';

// Окно выбора размера в стиле классического Windows.
// Вместо системного <select> (на телефоне он открывает неоформленный нативный список)
// показываем своё окно с крупными кнопками-плитками — удобно нажимать пальцем.
// Рендерится через портал в <body>, чтобы `overflow: hidden` родителя его не обрезал.
// sizes — размеры конкретного товара (product.sizes с бэкенда), а не фиксированный список.
function SizePicker({ sizes, value, onSelect, onClose }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    // Блокируем прокрутку страницы под открытым окном
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="sizepicker-overlay" onMouseDown={onClose}>
      <div
        className="sizepicker"
        role="dialog"
        aria-modal="true"
        aria-label="Выбор размера"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sysmsg-titlebar">
          <span className="sysmsg-title">Выберите размер</span>
          <button type="button" className="sysmsg-close" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sizepicker-body">
          <div className="sizepicker-grid" role="radiogroup" aria-label="Размер">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={s === value}
                ref={s === value ? activeRef : null}
                className={`sizepicker-tile${s === value ? ' is-active' : ''}`}
                onClick={() => onSelect(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="sizepicker-cancel" onClick={onClose}>
            отмена
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Блок «System message» — окно в стиле классического Windows с характеристиками товара.
// details: { density: string, composition: string } — плотность и состав ткани.
// sizes: string[] — размеры этого товара (product.sizes с бэкенда). Пустой массив —
// товар без размера (аксессуары и т.п.): выбор размера не показывается вовсе,
// в корзину добавляется с size: null.
// onAddToCart(size, buttonEl): вызывается при клике на кнопку «в корзину» — наверх уходит
// выбранный размер и сама кнопка (откуда стартует анимация полёта в корзину).
// Выбор размера и кнопка «в корзину» находятся внутри этого же окна.
// Закрывается по крестику; повторно открыть можно кнопкой-заглушкой снизу.
export default function SystemMessage({ details = {}, sizes = [], onAddToCart }) {
  const [closed, setClosed] = useState(false);
  const [size, setSize] = useState(sizes[0] ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { density = '—', composition = '—' } = details;
  const hasSizes = sizes.length > 0;

  // Товар загружается асинхронно (GET /api/products/:id) — в момент первого рендера
  // sizes ещё пустой массив. Как только список размеров приходит, выставляем первый
  // по умолчанию; если он уже выбран (например, при повторном рендере) — не трогаем.
  useEffect(() => {
    if (sizes.length === 0) {
      setSize(null);
    } else {
      setSize((prev) => (prev && sizes.includes(prev) ? prev : sizes[0]));
    }
  }, [sizes]);

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
          {hasSizes && (
            <button
              type="button"
              className="sysmsg-order-size"
              aria-haspopup="dialog"
              onClick={() => setPickerOpen(true)}
            >
              <span className="sysmsg-order-size-label">размер</span>
              <span className="sysmsg-order-size-value">{size}</span>
              <span className="sysmsg-order-size-arrow" aria-hidden="true">▾</span>
            </button>
          )}

          <button
            type="button"
            className="sysmsg-order-add-btn"
            onClick={(e) => onAddToCart?.(size, e.currentTarget)}
          >
            в корзину
          </button>
        </div>
      </div>

      {pickerOpen && hasSizes && (
        <SizePicker
          sizes={sizes}
          value={size}
          onClose={() => setPickerOpen(false)}
          onSelect={(s) => {
            setSize(s);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}