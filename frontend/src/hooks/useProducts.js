import { useEffect, useState } from 'react';
import { apiGet } from '../utils/api';

/**
 * Загружает товары одной коллекции (GET /api/products?collection=slug).
 * Используется вместо прежних захардкоженных списков
 * (homeProducts.js/saleItems.js/tshirtItems.js/archiveItems.js/collectionItems.js).
 * @param {string} collectionSlug
 * @returns {{ products: Array, loading: boolean, error: Error|null }}
 */
export function useProducts(collectionSlug) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiGet(`/api/products?collection=${encodeURIComponent(collectionSlug)}`, {
      signal: controller.signal,
    })
      .then(setProducts)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [collectionSlug]);

  return { products, loading, error };
}
