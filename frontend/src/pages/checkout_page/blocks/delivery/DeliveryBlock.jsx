import './DeliveryBlock.css';

const DELIVERY_TYPES = [
  { value: 'cdek', label: 'СДЭК' },
  { value: 'russian-post', label: 'Почта России' },
];

// Блок «1. Выберите тип доставки».
// value — выбранный тип, onChange(value) — колбэк наверх.
export default function DeliveryBlock({ value, onChange }) {
  return (
    <section className="checkout-section">
      <div className="checkout-section-header">
        <span className="checkout-section-number">1</span>
        <h2 className="checkout-section-title">выберите тип доставки</h2>
      </div>

      <div className="delivery-options">
        {DELIVERY_TYPES.map((type) => (
          <label key={type.value} className="delivery-option">
            <input
              type="radio"
              name="delivery-type"
              value={type.value}
              checked={value === type.value}
              onChange={() => onChange(type.value)}
            />
            <span>{type.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}