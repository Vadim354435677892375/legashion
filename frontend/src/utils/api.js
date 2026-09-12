// Единая точка входа для всех запросов к бэкенду legashion.
// В деве по умолчанию бьём в локальный backend (npm run dev на порту 4000),
// на проде — в VITE_API_URL, который прописывается в переменных окружения
// Vercel-проекта фронтенда (см. backend/README.md, раздел «Что нужно
// поменять на фронтенде»).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Ошибка запроса к серверу', data?.details);
  }

  return data;
}

export function apiGet(path, options = {}) {
  return request(path, { method: 'GET', ...options });
}

export function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return request(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiPut(path, body) {
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete(path) {
  return request(path, { method: 'DELETE' });
}

export { API_URL };
