import { useEffect, useRef, useState } from 'react';
import { apiPost, ApiError } from '../../../../utils/api';
import { formatPrice } from '../../../../utils/pricing';

// Поле «промокод» с проверкой на лету: через 500мс после того, как человек
// перестал печатать, бьём в POST /api/promo-codes/validate — тот же эндпоинт,
// которым потом пользуется бэкенд при оформлении заказа (backend/src/lib/orderPricing.js),
// так что результат точно совпадёт с тем, что будет применено к заказу.
//
// value/onChange — обычная пара для текста поля (как у остальных полей формы).
// items — товары корзины в формате { productId, size, qty } (для подсчёта суммы на сервере).
// onResult(data | null) — наверх уходит полный ответ validate (code/discountType/value/
// subtotal/discountAmount/totalPrice) при успехе, или null, если код пуст/невалиден/ещё не проверен —
// родитель использует это, чтобы показать итоговую сумму с учётом скidки.
const DEBOUNCE_MS = 500;

export default function PromoCodeField({ value, onChange, items, onResult }) {
  // 'idle' | 'checking' | 'valid' | 'invalid'
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState(null);
  const timerRef = useRef(null);
  const requestIdRef = useRef(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    clearTimeout(timerRef.current);
    const code = value.trim();

    if (!code) {
      requestIdRef.current += 1; // отменяем висящий запрос, если он был
      setStatus('idle');
      setMessage(null);
      onResultRef.current?.(null);
      return;
    }

    if (items.length === 0) {
      // Корзина пуста — проверять нечего, но и ошибку показывать незачем.
      return;
    }

    setStatus('checking');
    setMessage(null);

    const requestId = ++requestIdRef.current;
    timerRef.current = setTimeout(async () => {
      try {
        const data = await apiPost('/api/promo-codes/validate', {
          code,
          items: items.map((i) => ({ productId: i.productId, size: i.size ?? null, qty: i.qty })),
        });
        if (requestId !== requestIdRef.current) return; // пользователь уже ввёл что-то другое

        setStatus('valid');
        const discountText =
          data.discountType === 'PERCENT' ? `−${data.value}%` : `−${formatPrice(data.value)}`;
        setMessage(
          `Промокод действует: ${discountText} (скидка ${formatPrice(data.discountAmount)}). ` +
            `Итого: ${formatPrice(data.totalPrice)}`
        );
        onResultRef.current?.(data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setStatus('invalid');
        setMessage(
          err instanceof ApiError ? err.message : 'Не удалось проверить промокод. Проверьте соединение'
        );
        onResultRef.current?.(null);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [value, items]);

  return (
    <div className="details-field">
      <label className="details-label" htmlFor="promoCode">
        промокод
      </label>
      <input
        id="promoCode"
        name="promoCode"
        type="text"
        className={`details-input${status === 'invalid' ? ' details-input-error' : ''}`}
        placeholder="если есть"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {status === 'checking' && <span className="details-hint">проверяем…</span>}
      {status === 'valid' && <span className="details-success">{message}</span>}
      {status === 'invalid' && <span className="details-error">{message}</span>}
    </div>
  );
}
