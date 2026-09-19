// Общие хелперы для уведомлений о заказе (Telegram и email), чтобы формат и
// правила экранирования не расходились между каналами.

export const DELIVERY_LABELS = { CDEK: 'СДЭК', RUSSIAN_POST: 'Почта России' };
export const PAYMENT_LABELS = { CARD: 'банковская карта', SBP: 'СБП / SberPay / T-Pay' };

export function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}\u20BD`;
}

export function formatPhone(order) {
  const code = String(order.phoneCallingCode).replace(/^\+/, '');
  return `+${code} ${order.phone}`;
}

export function formatItemName(item) {
  return item.size ? `${item.name} (${item.size})` : item.name;
}

/**
 * Экранирует спецсимволы HTML. Поля заказа (ФИО, адрес, комментарий) вводит
 * клиент — без экранирования «<», «&» или «_» ломают разметку сообщения:
 * Telegram отвечает 400 «can't parse entities», и заказ приходит без уведомления,
 * а в письмо можно подсунуть произвольный HTML.
 */
export function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Обрезает длинный пользовательский текст (до экранирования, чтобы не разрезать «&amp;»). */
export function clip(value, max) {
  const s = String(value);
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Максимальное время ожидания внешнего сервиса: ответ клиенту не должен зависать из-за Telegram/SMTP. */
export const NOTIFY_TIMEOUT_MS = 8000;
