import AddressAutocomplete from './AddressAutocomplete';
import CountrySelect from './CountrySelect';
import PhoneField from './PhoneField';
import './DetailsForm.css';

const TEXT_FIELDS_AFTER = [
  { name: 'comment', label: 'комментарий' },
  { name: 'promoCode', label: 'промокод' },
];

function TextField({ field, values, onChange, errors }) {
  return (
    <div className="details-field" key={field.name}>
      <label className="details-label" htmlFor={field.name}>
        {field.label}
      </label>
      <input
        id={field.name}
        name={field.name}
        type={field.type ?? 'text'}
        className={`details-input${errors?.[field.name] ? ' details-input-error' : ''}`}
        autoComplete={field.autoComplete}
        value={values[field.name] ?? ''}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
      {errors?.[field.name] && <span className="details-error">{errors[field.name]}</span>}
    </div>
  );
}

// Блок «2. Введите данные».
// values — { fullName, phoneCallingCode, phone, countryCode, city, citySelected, cityData,
//            address, addressSelected, comment, promoCode }
// onChange(name, value) — для обычных текстовых полей, страны и телефона
// onAddressChange(name, value, { selected, data }) — для города/адреса (подсказки)
// errors — { [name]: 'текст ошибки' }
export default function DetailsForm({ values, onChange, onAddressChange, errors }) {
  return (
    <section className="checkout-section">
      <div className="checkout-section-header">
        <span className="checkout-section-number">2</span>
        <h2 className="checkout-section-title">введите данные</h2>
      </div>

      <div className="details-form">
        <TextField
          field={{ name: 'fullName', label: 'ФИО', autoComplete: 'name' }}
          values={values}
          onChange={onChange}
          errors={errors}
        />

        <PhoneField
          callingCode={values.phoneCallingCode}
          phone={values.phone}
          onCallingCodeChange={(code) => onChange('phoneCallingCode', code)}
          onPhoneChange={(value) => onChange('phone', value)}
          hasError={!!errors?.phone}
          errorText={errors?.phone}
        />

        <CountrySelect
          id="countryCode"
          name="countryCode"
          label="страна доставки"
          value={values.countryCode}
          onChange={(code) => onChange('countryCode', code)}
        />

        <AddressAutocomplete
          id="city"
          name="city"
          label="город доставки"
          placeholder="начните вводить город"
          value={values.city}
          onChange={(value, meta) => onAddressChange('city', value, meta)}
          mode="city"
          countryCode={values.countryCode}
          hasError={!!errors?.city}
        />

        <AddressAutocomplete
          id="address"
          name="address"
          label="адрес доставки"
          placeholder="улица, дом, квартира"
          value={values.address}
          onChange={(value, meta) => onAddressChange('address', value, meta)}
          mode="address"
          countryCode={values.countryCode}
          cityData={values.cityData}
          disabled={!values.citySelected}
          disabledHint="сначала выберите город доставки"
          hasError={!!errors?.address}
        />

        {TEXT_FIELDS_AFTER.map((field) => (
          <TextField key={field.name} field={field} values={values} onChange={onChange} errors={errors} />
        ))}
      </div>
    </section>
  );
}