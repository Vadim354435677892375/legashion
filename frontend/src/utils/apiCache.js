import { apiGet } from './api';

// Общий кэш GET-запросов на всё приложение (живёт, пока открыта вкладка).
// Схема «stale-while-revalidate»: при повторном заходе на страницу данные показываются
// мгновенно из кэша, а если они старше FRESH_MS — тихо обновляются в фоне.
// Одинаковые запросы, отправленные одновременно, склеиваются в один.
const FRESH_MS = 60 * 1000;

const cache = new Map(); // path → { data, time }
const inFlight = new Map(); // path → Promise

/** Возвращает запись кэша ({ data, time }) или undefined. */
export function peekCache(path) {
  return cache.get(path);
}

/** Актуальны ли данные (моложе FRESH_MS) — тогда повторный запрос не нужен. */
export function isFresh(path) {
  const entry = cache.get(path);
  return Boolean(entry) && Date.now() - entry.time < FRESH_MS;
}

/**
 * Запрашивает path и кладёт ответ в кэш. Запрос намеренно без AbortSignal:
 * он общий для нескольких компонентов, и уход с одной страницы не должен
 * обрывать загрузку — результат всё равно пригодится следующей.
 */
export function fetchCached(path) {
  if (inFlight.has(path)) return inFlight.get(path);

  const promise = apiGet(path)
    .then((data) => {
      cache.set(path, { data, time: Date.now() });
      return data;
    })
    .finally(() => inFlight.delete(path));

  inFlight.set(path, promise);
  return promise;
}

/** Сбросить кэш (весь или по одному адресу) — например, после правок в админке. */
export function invalidateCache(path) {
  if (path) cache.delete(path);
  else cache.clear();
}