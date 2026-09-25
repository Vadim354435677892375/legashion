import { useCachedGet } from './useCachedGet';

/**
 * Загружает метаданные коллекции по slug (GET /api/collections/:slug) —
 * заголовок страницы и текст бегущей строки. Используется CollectionPage.jsx.
 * Ответ кэшируется (см. utils/apiCache.js).
 * @param {string} slug
 */
export function useCollection(slug) {
  const { data, loading, error } = useCachedGet(`/api/collections/${encodeURIComponent(slug)}`);
  return { collection: data, loading, error };
}