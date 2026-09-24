import { useEffect, useReducer, useState } from 'react';
import { fetchCached, isFresh, peekCache } from '../utils/apiCache';

/**
 * GET с кэшем. Есть данные в кэше — возвращает их сразу (loading = false),
 * а устаревшие тихо обновляет в фоне. Нет — грузит, пока loading = true.
 * @param {string} path например '/api/products?collection=home'
 * @returns {{ data: any|null, loading: boolean, error: Error|null }}
 */
export function useCachedGet(path) {
  const [, rerender] = useReducer((n) => n + 1, 0);
  // Ошибку храним вместе с адресом, чтобы при смене path не показать чужую ошибку
  const [failure, setFailure] = useState(null);

  const entry = peekCache(path);

  useEffect(() => {
    if (isFresh(path)) return undefined;

    let cancelled = false;
    fetchCached(path)
      .then(() => {
        if (!cancelled) rerender();
      })
      .catch((error) => {
        // Если данные из кэша уже показаны, сбой фонового обновления игнорируем
        if (!cancelled && !peekCache(path)) setFailure({ path, error });
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  const error = failure?.path === path ? failure.error : null;

  return { data: entry ? entry.data : null, loading: !entry && !error, error };
}