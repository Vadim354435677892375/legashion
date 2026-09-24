import { useCachedGet } from './useCachedGet';
import { fetchCached } from '../utils/apiCache';

const pathFor = (slug) => `/api/products?collection=${encodeURIComponent(slug)}`;

// Товары главной страницы начинаем грузить уже при старте приложения (во время заставки),
// чтобы к моменту показа главной они уже лежали в кэше.
fetchCached(pathFor('home')).catch(() => {});

/**
 * Загружает товары одной коллекции (GET /api/products?collection=slug).
 * Ответ кэшируется: при возврате на страницу товары появляются сразу, без повторной загрузки.
 * @param {string} collectionSlug
 * @returns {{ products: Array, loading: boolean, error: Error|null }}
 */
export function useProducts(collectionSlug) {
  const { data, loading, error } = useCachedGet(pathFor(collectionSlug));
  return { products: data ?? [], loading, error };
}