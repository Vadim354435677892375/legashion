import { useMemo, useSyncExternalStore } from 'react';
import { apiGet } from '../utils/api';

// Картинки и видео сайта, которые админ заменил в админке (вкладка «Медиа»).
// Источник — GET /api/site-media: { media: { [ключ слота]: url }, playerTracks: [...] }.
// Список ключей живёт на бэкенде: backend/src/lib/mediaSlots.js.
//
// Данные — общие на всё приложение (один запрос на загрузку страницы, а не по запросу
// на каждый компонент). Запрос стартует уже при импорте этого модуля, то есть раньше,
// чем отрисуется заставка, а последний ответ кладётся в sessionStorage — при следующем
// заходе в этой вкладке сайт сразу рисуется с заменёнными картинками, без «подмены»
// на лету.

const CACHE_KEY = 'legashion_site_media_v1';
// Если бэкенд долго просыпается (холодный старт на Vercel), не держим страницу пустой:
// через это время показываем встроенные картинки, а заменённые подставятся по приходу ответа.
const SLOW_API_MS = 2500;

const EMPTY = { media: {}, playerTracks: [] };

function readCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (parsed && typeof parsed.media === 'object' && Array.isArray(parsed.playerTracks)) {
      return { media: parsed.media, playerTracks: parsed.playerTracks };
    }
  } catch {
    /* нет кэша / хранилище недоступно — не страшно */
  }
  return null;
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* приватный режим и т.п. */
  }
}

const cached = readCache();
// ready — «уже можно решать, что рисовать»: есть кэш, пришёл ответ или вышло время ожидания.
let state = { ...(cached ?? EMPTY), ready: Boolean(cached) };
const listeners = new Set();

function update(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

let inFlight = null;

/** Перезапрашивает данные с бэкенда (одновременно выполняется не больше одного запроса). */
export function refreshSiteMedia() {
  if (inFlight) return inFlight;

  const slowTimer = setTimeout(() => {
    if (!state.ready) update({ ready: true });
  }, SLOW_API_MS);

  inFlight = apiGet('/api/site-media')
    .then((data) => {
      const next = {
        media: data?.media && typeof data.media === 'object' ? data.media : {},
        playerTracks: Array.isArray(data?.playerTracks) ? data.playerTracks : [],
      };
      writeCache(next);
      update({ ...next, ready: true });
    })
    // Бэкенд недоступен — сайт остаётся рабочим на встроенных картинках.
    .catch(() => update({ ready: true }))
    .finally(() => {
      clearTimeout(slowTimer);
      inFlight = null;
    });

  return inFlight;
}

refreshSiteMedia();

/**
 * @returns {{
 *   ready: boolean,
 *   get: (key: string, fallback?: string|null) => string|null,
 *   playerTracks: Array<{ id: number, title: string, videoUrl: string, posterUrl: string|null }>,
 * }}
 * get(key, fallback) — адрес картинки для слота: заменённая в админке, иначе fallback
 * (обычно импортированная из assets, либо null → серый плейсхолдер). Пока ответ бэкенда
 * ещё не пришёл, возвращает null, чтобы сначала не мелькала картинка по умолчанию.
 */
export function useSiteMedia() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  return useMemo(
    () => ({
      ready: snapshot.ready,
      get: (key, fallback = null) => snapshot.media[key] ?? (snapshot.ready ? fallback : null),
      playerTracks: snapshot.playerTracks,
    }),
    [snapshot]
  );
}
