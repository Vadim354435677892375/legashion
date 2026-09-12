const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

/**
 * Запрашивает подсказки адреса у DaData. Токен теперь живёт только на сервере —
 * раньше (VITE_DADATA_TOKEN) он был виден в бандле фронтенда любому желающему.
 */
export async function fetchDaDataSuggestions(query, { fromBound, toBound, locations } = {}) {
  const token = process.env.DADATA_TOKEN;
  if (!token) {
    const err = new Error('DADATA_TOKEN не задан на сервере');
    err.status = 500;
    throw err;
  }
  if (!query || query.trim().length < 2) return [];

  const body = { query, count: 8 };
  if (fromBound) body.from_bound = fromBound;
  if (toBound) body.to_bound = toBound;
  if (locations) body.locations = locations;

  const response = await fetch(DADATA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = new Error(`DaData ответил с ошибкой: ${response.status}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  return data.suggestions ?? [];
}
