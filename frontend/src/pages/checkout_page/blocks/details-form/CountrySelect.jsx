import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, POPULAR_COUNTRIES } from '../../../../utils/countries';
import './AddressAutocomplete.css';

// Стилизованный выбор страны: поле с поиском по названию + выпадающий список,
// оформлен так же, как подсказки города/адреса (см. AddressAutocomplete.jsx),
// поскольку у нативного <select> список опций браузер рисует сам и его нельзя
// стилизовать под сайт. Без ввода текста показываются только популярные страны
// (POPULAR_COUNTRIES) — так список короче и удобнее; при вводе текста поиск идёт
// по всем COUNTRIES, так что редкие страны тоже находятся.
export default function CountrySelect({ id, name, label, value, onChange }) {
  const selected = useMemo(() => COUNTRIES.find((c) => c.code === value), [value]);

  const [query, setQuery] = useState(selected?.name ?? '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const wrapperRef = useRef(null);

  // Если код страны меняется снаружи (например, сброс формы) — синхронизируем текст поля.
  useEffect(() => {
    setQuery(selected?.name ?? '');
  }, [selected]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(selected?.name ?? ''); // не выбрали — откатываем текст к текущей стране
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === selected?.name.toLowerCase()) return POPULAR_COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, selected]);

  const selectCountry = (country) => {
    onChange(country.code);
    setQuery(country.name);
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && filtered[highlighted]) {
        e.preventDefault();
        selectCountry(filtered[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.name ?? '');
    }
  };

  return (
    <div className="details-field address-autocomplete" ref={wrapperRef}>
      <label className="details-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        className="details-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={(e) => {
          e.target.select();
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      {open && filtered.length > 0 && (
        <ul className="address-autocomplete-list" role="listbox">
          {filtered.map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={c.code === value}
              className={`address-autocomplete-item${i === highlighted ? ' is-highlighted' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCountry(c)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}