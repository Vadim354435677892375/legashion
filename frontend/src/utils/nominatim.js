// Подсказки адресов вне России — через бесплатный геокодер OpenStreetMap (Nominatim).
// Официальная политика использования Nominatim: не больше 1 запроса в секунду,
// без параллельных запросов, и просьба идентифицировать приложение — из браузера
// кастомный User-Agent поставить нельзя (браузер сам его подставляет), поэтому
// сервис определяет источник по заголовку Referer, который шлёт браузер автоматически.
// Для небольшого магазина это ок; при росте трафика стоит перейти на платный сервис
// (например, Google Places) — см. комментарий в dadata.js по аналогии.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * @param {string} query
 * @param {object} options
 * @param {string} [options.countryCode] — ISO 3166-1 alpha-2, напр. 'DE'
 * @param {'city'|'address'} [options.mode] — искать город или полный адрес
 * @param {string} [options.cityContext] — уже выбранный город, чтобы сузить поиск адреса
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<{value: string, data: object}>>}
 */
export async function fetchNominatimSuggestions(query, options = {}) {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    limit: '8',
    'accept-language': 'ru',
  });

  if (options.countryCode) params.set('countrycodes', options.countryCode.toLowerCase());

  if (options.mode === 'city') {
    params.set('featureType', 'city');
    params.set('q', query);
  } else {
    // Ищем полный адрес; если уже знаем город — добавляем его в запрос,
    // чтобы результаты не разъезжались по всей стране.
    const q = options.cityContext ? `${options.cityContext}, ${query}` : query;
    params.set('q', q);
  }

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Nominatim ответил с ошибкой: ${response.status}`);
  }

  const results = await response.json();

  // Приводим к тому же формату, что и dadata.js: { value, data }
  return results.map((r) => ({
    value: r.display_name,
    data: {
      lat: r.lat,
      lon: r.lon,
      city:
        r.address?.city || r.address?.town || r.address?.village || r.address?.municipality || '',
      country: r.address?.country || '',
      countryCode: (r.address?.country_code || '').toUpperCase(),
      raw: r.address,
    },
  }));
}