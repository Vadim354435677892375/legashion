import { apiGet } from './api';
import { DEFAULT_COUNTRY_CODE } from './countries';

/**
 * Единая точка входа для подсказок адреса — теперь через бэкенд
 * (GET /api/geocode/suggest), который сам решает DaData (Россия) или
 * Nominatim (остальной мир) и прячет ключ DaData на сервере.
 *
 * @param {string} query
 * @param {object} options
 * @param {string} options.countryCode — ISO 3166-1 alpha-2
 * @param {'city'|'address'} options.mode
 * @param {object} [options.cityData] — data выбранного города (для сужения поиска адреса)
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array<{value: string, data: object}>>}
 */
export async function fetchSuggestions(query, options) {
  const { countryCode, mode, cityData, signal } = options;

  const params = new URLSearchParams({ query, countryCode, mode });

  if (mode === 'address' && cityData) {
    if (countryCode === DEFAULT_COUNTRY_CODE) {
      // Сужаем поиск по уже выбранному городу/региону (см. lib/dadata.js на бэкенде).
      if (cityData.region) params.set('region', cityData.region);
      const city = cityData.city || cityData.settlement;
      if (city) params.set('city', city);
    } else if (cityData.city) {
      params.set('city', cityData.city);
    }
  }

  return apiGet(`/api/geocode/suggest?${params.toString()}`, { signal });
}
