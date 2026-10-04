import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './SystemMessage.css';

// Окно выбора размера в стиле классического Windows.
// Вместо системного <select> (на телефоне он открывает неоформленный нативный список)
// показываем своё окно с крупными кнопками-плитками — удобно нажимать пальцем.
// Рендерится через портал в <body>, чтобы `overflow: hidden` родителя его не обрезал.
// sizes — размеры конкретного товара (product.sizes с бэкенда), а не фиксированный список.
// stock — { S: 3, M: 0 }: под каждой плиткой пишем, сколько штук осталось; размер с 0 недоступен.
function SizePicker({ sizes, stock, value, onSelect, onClose }) {
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
            {sizes.map((s) => {
              const left = stock[s] ?? 0;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={s === value}
                  ref={s === value ? activeRef : null}
                  className={`sizepicker-tile${s === value ? ' is-active' : ''}${left === 0 ? ' is-soldout' : ''}`}
                  disabled={left === 0}
                  onClick={() => onSelect(s)}
                >
                  <span className="sizepicker-tile-size">{s}</span>
                  <span className="sizepicker-tile-left">{left === 0 ? 'нет' : `${left} шт.`}</span>
                </button>
              );
            })}
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
// description: string — описание товара из админки; если пусто — в окне ничего не выводится.
// sizes: string[] — размеры этого товара (product.sizes с бэкенда). Пустой массив —
// товар без размера (аксессуары и т.п.): выбор размера не показывается вовсе,
// в корзину добавляется с size: null.
// onAddToCart(size, buttonEl): вызывается при клике на кнопку «в корзину» — наверх уходит
// выбранный размер и сама кнопка (откуда стартует анимация полёта в корзину).
// Выбор размера и кнопка «в корзину» находятся внутри этого же окна.
// Закрывается по крестику; повторно открыть можно кнопкой-заглушкой снизу.
// stock: { S: 3, M: 0 } — остаток по размерам; quantity — остаток товара без размеров.
// cartQty(size) — сколько штук этого размера уже в корзине (чтобы не дать добавить больше остатка).
export default function SystemMessage({
  description = '',
  sizes = [],
  stock = {},
  quantity = null,
  cartQty = () => 0,
  onAddToCart,
}) {
  const [closed, setClosed] = useState(false);
  const [size, setSize] = useState(sizes[0] ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasSizes = sizes.length > 0;

  // Товар загружается асинхронно (GET /api/products/:id) — в момент первого рендера
  // sizes ещё пустой массив. Как только список размеров приходит, выставляем первый
  // по умолчанию; если он уже выбран (например, при повторном рендере) — не трогаем.
  // По умолчанию выбираем первый размер, который есть в наличии (иначе — первый вообще).
  useEffect(() => {
    if (sizes.length === 0) {
      setSize(null);
    } else {
      setSize((prev) => {
        if (prev && sizes.includes(prev) && (stock[prev] ?? 0) > 0) return prev;
        return sizes.find((s) => (stock[s] ?? 0) > 0) ?? sizes[0];
      });
    }
  }, [sizes, stock]);

  // Сколько осталось именно для выбранного варианта и сколько ещё можно положить в корзину.
  const available = hasSizes ? (stock[size] ?? 0) : (quantity ?? 0);
  const canAdd = available - cartQty(size) > 0;
  const allSoldOut = hasSizes
    ? sizes.every((s) => (stock[s] ?? 0) === 0)
    : (quantity ?? 0) === 0;

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
        {description.trim() && <p style={{ whiteSpace: 'pre-line' }}>{description}</p>}

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
            disabled={!canAdd}
            onClick={(e) => onAddToCart?.(size, e.currentTarget)}
          >
            {allSoldOut
              ? 'нет в наличии'
              : available === 0
                ? 'выберите другой размер'
                : canAdd
                  ? 'в корзину'
                  : 'всё уже в корзине'}
          </button>
        </div>
      </div>

      {pickerOpen && hasSizes && (
        <SizePicker
          sizes={sizes}
          stock={stock}
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