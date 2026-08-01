import { useMemo } from 'react';
import PhoneCodeSelect from './PhoneCodeSelect';
import { PHONE_CODES } from '../../../../utils/phoneCodes';
import './PhoneField.css';

// Поле «телефон»: код страны (по умолчанию +7) + сам номер.
// В номере разрешены только цифры — всё остальное отсекается на вводе/вставке.
// Максимальная длина номера подстраивается под выбранную страну
// (напр. Россия — 10 цифр, Грузия — 9), см. utils/phoneCodes.js.
// callingCode — код без «+» (напр. '7'), phone — только цифры номера без кода.
export default function PhoneField({
  callingCode,
  phone,
  onCallingCodeChange,
  onPhoneChange,
  hasError,
  errorText,
}) {
  const country = useMemo(
    () => PHONE_CODES.find((c) => c.callingCode === callingCode) ?? PHONE_CODES[0],
    [callingCode]
  );
  const maxLength = Math.max(...country.possibleLengths);
  const expectedLength = country.possibleLengths[0];

  return (
    <div className="details-field">
      <label className="details-label" htmlFor="phone">
        телефон
      </label>
      <div className="phone-field-row">
        <PhoneCodeSelect value={callingCode} onChange={onCallingCodeChange} />
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={maxLength}
          className={`details-input phone-number-input${hasError ? ' details-input-error' : ''}`}
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      {hasError ? (
        <span className="details-error">{errorText}</span>
      ) : (
        <span className="phone-field-hint">
          номер без кода страны, {expectedLength} {expectedLength === 1 ? 'цифра' : 'цифр'}
        </span>
      )}
    </div>
  );
}