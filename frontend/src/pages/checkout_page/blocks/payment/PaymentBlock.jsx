import './PaymentBlock.css';

const PAYMENT_METHODS = [
  { value: 'card', label: 'банковская карта' },
  { value: 'sbp', label: 'СБП, SberPay, T-Pay' },
];

// Блок «3. Способ оплаты» + чекбоксы согласия с условиями.
// value — выбранный способ оплаты, onChange(value)
// agreements — { terms, personalData }, onAgreementChange(name, checked)
// errors — { paymentMethod, agreements }
export default function PaymentBlock({ value, onChange, agreements, onAgreementChange, errors }) {
  return (
    <section className="checkout-section">
      <div className="checkout-section-header">
        <span className="checkout-section-number">3</span>
        <h2 className="checkout-section-title">способ оплаты</h2>
      </div>

      <div className="payment-options">
        {PAYMENT_METHODS.map((method) => (
          <label key={method.value} className="payment-option">
            <input
              type="radio"
              name="payment-method"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
            />
            <span>{method.label}</span>
          </label>
        ))}
        {errors?.paymentMethod && <span className="payment-error">{errors.paymentMethod}</span>}
      </div>

      <div className="payment-agreements">
        <label className="payment-agreement">
          <input
            type="checkbox"
            checked={agreements.terms}
            onChange={(e) => onAgreementChange('terms', e.target.checked)}
          />
          <span>
            Согласен с условиями <a href="#offer">публичной оферты</a>
          </span>
        </label>
        <label className="payment-agreement">
          <input
            type="checkbox"
            checked={agreements.personalData}
            onChange={(e) => onAgreementChange('personalData', e.target.checked)}
          />
          <span>
            Согласен на обработку персональных данных, подробнее в{' '}
            <a href="#privacy">политике конфиденциальности</a>
          </span>
        </label>
        {errors?.agreements && <span className="payment-error">{errors.agreements}</span>}
      </div>
    </section>
  );
}