import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { DEFAULT_COUNTRY_CODE } from '../../utils/countries';
import { DEFAULT_PHONE_CODE, PHONE_CODES } from '../../utils/phoneCodes';
import { apiPost, ApiError } from '../../utils/api';
import logo from '../../assets/logo-glitch.gif';
import DeliveryBlock from './blocks/delivery/DeliveryBlock';
import DetailsForm from './blocks/details-form/DetailsForm';
import PaymentBlock from './blocks/payment/PaymentBlock';
import './CheckoutPage.css';

// Склонение слова «товар» по числу (1 товар, 2 товара, 5 товаров).
function pluralizeItems(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'товара';
  return 'товаров';
}

const INITIAL_DETAILS = {
  fullName: '',
  phoneCallingCode: DEFAULT_PHONE_CODE.callingCode, // '7' — Россия, по стандарту магазина
  phone: '',
  countryCode: DEFAULT_COUNTRY_CODE,
  city: '',
  citySelected: false,
  cityData: null,
  address: '',
  addressSelected: false,
  addressData: null,
  comment: '',
  promoCode: '',
};

// Значения радиокнопок на фронте → enum'ы бэкенда (см. backend/prisma/schema.prisma).
const DELIVERY_TYPE_TO_API = { cdek: 'CDEK', 'russian-post': 'RUSSIAN_POST' };
const PAYMENT_METHOD_TO_API = { card: 'CARD', sbp: 'SBP' };

// Страница «Оформление заказа». Заказ гостевой (без аккаунта) — уходит на
// POST /api/orders, бэкенд сам сохраняет его и уведомляет администратора
// в Telegram и на почту (см. backend/src/routes/orders.js).
export default function CheckoutPage() {
  const { items, totalCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState('cdek');
  const [details, setDetails] = useState(INITIAL_DETAILS);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [agreements, setAgreements] = useState({ terms: false, personalData: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState(null);

  const handleDetailsChange = (name, value) => {
    setDetails((prev) => {
      const next = { ...prev, [name]: value };
      // Город/адрес привязаны к стране — при её смене они больше не валидны.
      if (name === 'countryCode' && prev.countryCode !== value) {
        next.city = '';
        next.citySelected = false;
        next.cityData = null;
        next.address = '';
        next.addressSelected = false;
        next.addressData = null;
      }
      return next;
    });
  };

  // Город/адрес: пока пользователь не выбрал вариант из подсказок DaData, значение
  // считается неподтверждённым (selected: false) — на этом строится валидация «адрес настоящий».
  const handleAddressChange = (name, value, { selected, data }) => {
    setDetails((prev) => {
      const next = {
        ...prev,
        [name]: value,
        [`${name}Selected`]: selected,
        [`${name}Data`]: data,
      };
      // При смене города уже выбранный адрес из старого города больше не валиден.
      if (name === 'city' && prev.city !== value) {
        next.address = '';
        next.addressSelected = false;
        next.addressData = null;
      }
      return next;
    });
  };

  const handleAgreementChange = (name, checked) => {
    setAgreements((prev) => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const nextErrors = {};
    if (items.length === 0) nextErrors.cart = 'Корзина пуста';
    if (!details.fullName.trim()) nextErrors.fullName = 'Укажите ФИО';
    if (!details.phone.trim()) {
      nextErrors.phone = 'Укажите телефон';
    } else {
      const phoneCountry =
        PHONE_CODES.find((c) => c.callingCode === details.phoneCallingCode) ?? DEFAULT_PHONE_CODE;
      if (!phoneCountry.possibleLengths.includes(details.phone.length)) {
        const expected = phoneCountry.possibleLengths.join(' или ');
        nextErrors.phone = `Для +${phoneCountry.callingCode} номер должен содержать ${expected} цифр`;
      }
    }
    if (!details.city.trim()) {
      nextErrors.city = 'Укажите город доставки';
    } else if (!details.citySelected) {
      nextErrors.city = 'Выберите город из списка подсказок';
    }
    if (!details.address.trim()) {
      nextErrors.address = 'Укажите адрес доставки';
    } else if (!details.addressSelected) {
      nextErrors.address = 'Выберите адрес из списка подсказок';
    }
    if (!agreements.terms || !agreements.personalData) {
      nextErrors.agreements = 'Нужно согласиться с условиями, чтобы продолжить';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const order = await apiPost('/api/orders', {
        fullName: details.fullName.trim(),
        phoneCallingCode: details.phoneCallingCode,
        phone: details.phone,
        countryCode: details.countryCode,
        city: details.city,
        cityData: details.cityData,
        address: details.address,
        addressData: details.addressData,
        comment: details.comment,
        promoCode: details.promoCode,
        deliveryType: DELIVERY_TYPE_TO_API[deliveryType] ?? 'CDEK',
        paymentMethod: PAYMENT_METHOD_TO_API[paymentMethod] ?? 'CARD',
        // Цену не отправляем: бэкенд считает её сам по productId (иначе её можно подделать).
        items: items.map((i) => ({ productId: i.productId, size: i.size ?? null, qty: i.qty })),
      });

      clearCart();
      setSubmittedOrderNumber(order.orderNumber);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Не удалось отправить заказ. Проверьте соединение и попробуйте ещё раз.';
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <img className="checkout-logo" src={logo} alt="LEGASHION" />
        <div className="checkout-header-text">
          <span className="checkout-header-title">оформление заказа</span>
          <span className="checkout-header-count">
            {totalCount} {pluralizeItems(totalCount)}
          </span>
        </div>
      </header>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <DeliveryBlock value={deliveryType} onChange={setDeliveryType} />

        <DetailsForm
          values={details}
          onChange={handleDetailsChange}
          onAddressChange={handleAddressChange}
          errors={errors}
        />

        <PaymentBlock
          value={paymentMethod}
          onChange={setPaymentMethod}
          agreements={agreements}
          onAgreementChange={handleAgreementChange}
          errors={errors}
        />

        {submittedOrderNumber && (
          <p className="checkout-submitted-note">
            Заказ {submittedOrderNumber} оформлен. Мы получили его и скоро с вами свяжемся.
          </p>
        )}

        {errors.submit && <p className="checkout-submit-error">{errors.submit}</p>}
        {errors.cart && <p className="checkout-submit-error">{errors.cart}</p>}

        <div className="checkout-actions">
          <button
            type="button"
            className="checkout-back-btn"
            onClick={() => navigate(-1)}
          >
            вернуться назад
          </button>
          <button type="submit" className="checkout-continue-btn" disabled={submitting}>
            {submitting ? 'отправляем…' : 'продолжить'}
          </button>
        </div>
      </form>
    </div>
  );
}