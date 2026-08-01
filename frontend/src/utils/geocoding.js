import { fetchAddressSuggestions } from './dadata';
import { fetchNominatimSuggestions } from './nominatim';
import { DEFAULT_COUNTRY_CODE } from './countries';

/**
 * Единая точка входа для подсказок адреса.
 * Россия → DaData (лучше качество и детализация для РФ).
 * Любая другая страна → Nominatim/OpenStreetMap (бесплатно, без ключа, весь мир).
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

  if (countryCode === DEFAULT_COUNTRY_CODE) {
    if (mode === 'city') {
      return fetchAddressSuggestions(query, {
        fromBound: { value: 'city' },
        toBound: { value: 'settlement' },
        signal,
      });
    }
    const locations = cityData
      ? [{ region: cityData.region, city: cityData.city || cityData.settlement || undefined }]
      : undefined;
    return fetchAddressSuggestions(query, {
      fromBound: { value: 'street' },
      toBound: { value: 'house' },
      locations,
      signal,
    });
  }

  return fetchNominatimSuggestions(query, {
    countryCode,
    mode,
    cityContext: mode === 'address' ? cityData?.city : undefined,
    signal,
  });
}