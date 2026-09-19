import {
  DELIVERY_LABELS,
  PAYMENT_LABELS,
  NOTIFY_TIMEOUT_MS,
  clip,
  escapeHtml,
  formatItemName,
  formatPhone,
  formatPrice,
} from './orderFormat.js';

// Жёсткий лимит Bot API на длину одного сообщения.
const TELEGRAM_MAX_LENGTH = 4096;

const esc = (value, max = 300) => escapeHtml(clip(value, max));

/**
 * Собирает текст сообщения (parse_mode=HTML). Если заказ не влезает в лимит
 * Telegram, хвост списка товаров заменяется на «… и ещё N поз.».
 */
export function buildTelegramText(order) {
  const build = (shownItems) => {
    const hidden = order.items.length - shownItems;
    const lines = order.items.slice(0, shownItems).map(
      (i) => `— ${esc(formatItemName(i), 120)} × ${i.qty} = ${formatPrice(i.price * i.qty)}`
    );
    if (hidden > 0) lines.push(`… и ещё ${hidden} поз.`);

    return [
      `🛒 <b>Новый заказ ${esc(order.orderNumber)}</b>`,
      '',
      `Клиент: ${esc(order.fullName, 150)}`,
      `Телефон: ${esc(formatPhone(order), 40)}`,
      `Доставка: ${esc(DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType)}`,
      `Оплата: ${esc(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}`,
      `Город: ${esc(order.city, 150)}`,
      `Адрес: ${esc(order.address)}`,
      order.comment ? `Комментарий: ${esc(order.comment, 600)}` : null,
      order.promoCode ? `Промокод: ${esc(order.promoCode, 50)}` : null,
      '',
      'Состав заказа:',
      ...lines,
      '',
      `Итого: <b>${formatPrice(order.totalPrice)}</b>`,
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  let shown = order.items.length;
  let text = build(shown);
  while (text.length > TELEGRAM_MAX_LENGTH && shown > 1) {
    shown -= 1;
    text = build(shown);
  }
  return text;
}

/**
 * Отправляет сообщение о новом заказе в Telegram-чат/канал администратора.
 * Использует голый Bot API через fetch — отдельная библиотека не нужна для
 * одного метода sendMessage. При ошибке бросает исключение — его логирует
 * вызывающий код (routes/orders.js), а клиенту заказ всё равно подтверждается.
 * @param {import('@prisma/client').Order & { items: import('@prisma/client').OrderItem[] }} order
 */
export async function notifyTelegramNewOrder(order) {
  // Переменные читаем при вызове, а не при импорте модуля: так не важен порядок
  // загрузки dotenv, и настройки можно подменять в тестах.
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — уведомление в Telegram пропущено');
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramText(order),
      parse_mode: 'HTML',
    }),
    signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API ответил ${response.status}: ${body}`);
  }
}
