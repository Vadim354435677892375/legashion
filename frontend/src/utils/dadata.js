const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';
const TOKEN = import.meta.env.VITE_DADATA_TOKEN;

// Класс ошибки, чтобы вызывающий код мог отличить «нет ключа» от сетевой ошибки.
export class DaDataConfigError extends Error {}

/**
 * Запрашивает подсказки адреса у DaData.
 * @param {string} query — то, что ввёл пользователь
 * @param {object} options
 * @param {{value: string}} [options.fromBound] — нижняя граница детализации (напр. {value: 'city'})
 * @param {{value: string}} [options.toBound] — верхняя граница детализации (напр. {value: 'house'})
 * @param {object[]} [options.locations] — сузить поиск (напр. [{ city: 'Москва' }])
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<Array>} массив подсказок DaData (value, unrestricted_value, data)
 */
export async function fetchAddressSuggestions(query, options = {}) {
  if (!TOKEN) {
    throw new DaDataConfigError(
      'Не задан VITE_DADATA_TOKEN. Создай frontend/.env на основе .env.example и впиши свой ключ DaData.'
    );
  }
  if (!query || query.trim().length < 2) return [];

  const body = {
    query,
    count: 8,
  };
  if (options.fromBound) body.from_bound = options.fromBound;
  if (options.toBound) body.to_bound = options.toBound;
  if (options.locations) body.locations = options.locations;

  const response = await fetch(DADATA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${TOKEN}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`DaData ответил с ошибкой: ${response.status}`);
  }

  const data = await response.json();
  return data.suggestions ?? [];
}