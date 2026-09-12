import { useEffect, useState } from 'react';
import { apiGet } from '../utils/api';

/**
 * Загружает метаданные коллекции по slug (GET /api/collections/:slug) —
 * заголовок страницы и текст бегущей строки. Используется CollectionPage.jsx
 * вместо прежнего захардкоженного collectionItems.js.
 * @param {string} slug
 */
export function useCollection(slug) {
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiGet(`/api/collections/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(setCollection)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  return { collection, loading, error };
}
