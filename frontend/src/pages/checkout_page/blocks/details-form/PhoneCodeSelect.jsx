import { useEffect, useMemo, useRef, useState } from 'react';
import { PHONE_CODES, POPULAR_PHONE_CODES } from '../../../../utils/phoneCodes';
import './AddressAutocomplete.css';
import './PhoneField.css';

// Компактный выпадающий список телефонных кодов («+7 Россия», «+1 США» и т.п.).
// Свёрнутое состояние показывает только «+код»; без ввода текста открывается список
// популярных кодов (POPULAR_PHONE_CODES); при вводе — поиск идёт по всем PHONE_CODES
// (по названию страны или по цифрам кода), так что редкие коды тоже находятся.
export default function PhoneCodeSelect({ value, onChange }) {
  const selected = useMemo(
    () => PHONE_CODES.find((c) => c.callingCode === value) ?? PHONE_CODES[0],
    [value]
  );

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, '');
    if (!q) return POPULAR_PHONE_CODES;
    return PHONE_CODES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.callingCode.startsWith(q)
    );
  }, [query]);

  const selectCode = (country) => {
    onChange(country.callingCode);
    setQuery('');
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
        selectCode(filtered[highlighted]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="address-autocomplete phone-code-select" ref={wrapperRef}>
      <input
        type="text"
        autoComplete="off"
        className="details-input phone-code-input"
        value={open ? query : `+${selected.callingCode}`}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={(e) => {
          setOpen(true);
          e.target.select();
        }}
        onKeyDown={handleKeyDown}
        aria-label="Код страны для телефона"
      />

      {open && filtered.length > 0 && (
        <ul className="address-autocomplete-list phone-code-list" role="listbox">
          {filtered.map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={c.callingCode === selected.callingCode}
              className={`address-autocomplete-item${i === highlighted ? ' is-highlighted' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCode(c)}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span className="phone-code-item-code">+{c.callingCode}</span>
              <span className="phone-code-item-name">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}