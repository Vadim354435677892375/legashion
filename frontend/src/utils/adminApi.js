// Клиент админского API (/api/admin/*). Отдельно от utils/api.js, потому что
// каждому запросу нужен заголовок Authorization: Bearer <token>, который
// выдаёт POST /api/admin/auth/login (см. backend/src/middleware/adminAuth.js).
import { API_URL, ApiError } from './api';

const TOKEN_KEY = 'legashion_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // приватный режим браузера / заблокированное хранилище
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* игнорируем — токен просто проживёт до перезагрузки страницы */
  }
}

// Токен живёт 7 дней (JWT_EXPIRES_IN), поэтому протухший токен в localStorage —
// обычное дело. Ловим 401 в одном месте и разлогиниваем, чтобы каждая вкладка
// админки не разбиралась с этим сама.
let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

async function adminRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (response.status === 401) {
    setToken(null);
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Ошибка запроса к серверу', data?.details);
  }

  return data;
}

export function adminGet(path) {
  return adminRequest(path, { method: 'GET' });
}

export function adminPost(path, body) {
  return adminRequest(path, { method: 'POST', body: JSON.stringify(body) });
}

export function adminPut(path, body) {
  return adminRequest(path, { method: 'PUT', body: JSON.stringify(body) });
}

export function adminPatch(path, body) {
  return adminRequest(path, { method: 'PATCH', body: JSON.stringify(body) });
}

export function adminDelete(path) {
  return adminRequest(path, { method: 'DELETE' });
}

/**
 * Загружает файл в Yandex Object Storage через POST /api/admin/upload.
 * @param {File} file
 * @returns {Promise<string>} публичный URL картинки — его кладём в imageUrls товара
 */
export async function adminUploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { url } = await adminRequest('/api/admin/upload', { method: 'POST', body: formData });
  return url;
}

/**
 * Загружает картинку или видео в бакет напрямую из браузера (в обход нашего сервера, у которого
 * на Vercel лимит на размер запроса): просим у бэкенда подписанную ссылку, затем PUT файла на неё.
 * @param {File} file
 * @param {{ onProgress?: (fraction: number) => void }} [options] — fraction от 0 до 1
 * @returns {Promise<string>} публичный URL загруженного файла
 */
export async function adminUploadMedia(file, { onProgress } = {}) {
  const { uploadUrl, publicUrl, headers } = await adminPost('/api/admin/upload/presign', {
    contentType: file.type,
    size: file.size,
  });

  await new Promise((resolve, reject) => {
    // XMLHttpRequest вместо fetch: только он умеет сообщать прогресс отправки — для видео это важно.
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    Object.entries(headers).forEach(([name, value]) => xhr.setRequestHeader(name, value));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Хранилище отклонило файл (код ${xhr.status}). Возможно, истекла ссылка — повторите загрузку.`));
    };
    // Сюда же попадает блокировка браузером из-за CORS — см. раздел про CORS бакета в backend/README.md.
    xhr.onerror = () =>
      reject(new Error('Не удалось загрузить файл в хранилище. Проверьте интернет и настройку CORS у бакета.'));
    xhr.send(file);
  });

  return publicUrl;
}

/**
 * Логин админа. Токен сразу сохраняется — дальше все adminGet/adminPost его подхватят.
 */
export async function adminLogin(email, password) {
  const response = await fetch(`${API_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'Не удалось войти', data?.details);
  }

  setToken(data.token);
  return data;
}

export function adminLogout() {
  setToken(null);
}

/** Проверка, что сохранённый токен ещё живой (GET /api/admin/auth/me). */
export function adminMe() {
  return adminGet('/api/admin/auth/me');
}