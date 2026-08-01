import { useEffect, useRef, useState } from 'react';
import { fetchSuggestions } from '../../../../utils/geocoding';
import { DaDataConfigError } from '../../../../utils/dadata';
import './AddressAutocomplete.css';

const DEBOUNCE_MS = 300;

/**
 * Поле ввода с подсказками реальных адресов (город/улица/дом).
 * Источник подсказок выбирается автоматически в geocoding.js: DaData для России,
 * Nominatim (OpenStreetMap) — для остальных стран.
 * Пока пользователь не выберет вариант из выпадающего списка, значение
 * считается «не подтверждённым» — родитель получает об этом сигнал через onChange.
 *
 * value — текущий текст поля
 * onChange(value, { selected, data }) — data — нормализованный объект подсказки
 * mode — 'city' | 'address'
 * countryCode — ISO 3166-1 alpha-2 текущей страны доставки
 * cityData — данные выбранного города (для сужения поиска адреса)
 * disabled — например, пока не выбран город для поля «адрес»
 */
export default function AddressAutocomplete({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  mode,
  countryCode,
  cityData,
  disabled,
  disabledHint,
  hasError,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [configError, setConfigError] = useState(false);

  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  // Закрываем список при клике вне поля.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = (query) => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await fetchSuggestions(query, {
          countryCode,
          mode,
          cityData,
          signal: controller.signal,
        });
        setSuggestions(results);
        setOpen(true);
        setHighlighted(-1);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (err instanceof DaDataConfigError) {
          setConfigError(true);
        } else {
          console.error(err);
        }
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    // Пока не выбрали новую подсказку — значение не подтверждено.
    onChange(nextValue, { selected: false, data: null });
    runSearch(nextValue);
  };

  const selectSuggestion = (suggestion) => {
    onChange(suggestion.value, { selected: true, data: suggestion.data });
    setSuggestions([]);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="details-field address-autocomplete" ref={wrapperRef}>
      <label className="details-label" htmlFor={id}>
        {label}
      </label>
      <div className="address-autocomplete-input-wrap">
        <input
          id={id}
          name={name}
          type="text"
          autoComplete="off"
          className={`details-input${hasError ? ' details-input-error' : ''}`}
          placeholder={disabled ? disabledHint : placeholder}
          value={value ?? ''}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {loading && <span className="address-autocomplete-spinner" aria-hidden="true" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="address-autocomplete-list" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.value}-${i}`}
              role="option"
              aria-selected={i === highlighted}
              className={`address-autocomplete-item${i === highlighted ? ' is-highlighted' : ''}`}
              onMouseDown={(e) => e.preventDefault()} // не даём инпуту потерять фокус раньше клика
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {s.value}
            </li>
          ))}
        </ul>
      )}

      {configError && (
        <span className="details-error">
          Не настроен ключ DaData — см. frontend/.env.example
        </span>
      )}
    </div>
  );
}