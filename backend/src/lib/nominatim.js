const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Подсказки адресов вне России через Nominatim (OpenStreetMap).
 * Политика Nominatim требует identify своего приложения — с сервера это
 * делаем явным заголовком User-Agent (в браузере это было невозможно).
 */
export async function fetchNominatimSuggestions(query, { countryCode, mode, cityContext } = {}) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    'accept-language': 'ru',
  });

  if (countryCode) params.set('countrycodes', countryCode.toLowerCase());

  if (mode === 'city') {
    params.set('featureType', 'city');
    params.set('q', query);
  } else {
    const q = cityContext ? `${cityContext}, ${query}` : query;
    params.set('q', q);
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'legashion-shop/1.0 (contact: admin@legashion.ru)',
    },
  });

  if (!response.ok) {
    const err = new Error(`Nominatim ответил с ошибкой: ${response.status}`);
    err.status = 502;
    throw err;
  }

  const results = await response.json();

  return results.map((r) => ({
    value: r.display_name,
    data: {
      lat: r.lat,
      lon: r.lon,
      city: r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || '',
      country: r.address?.country || '',
      countryCode: (r.address?.country_code || '').toUpperCase(),
      raw: r.address,
    },
  }));
}
