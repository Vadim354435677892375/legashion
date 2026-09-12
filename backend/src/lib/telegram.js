const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}\u20BD`;
}

const DELIVERY_LABELS = { CDEK: 'СДЭК', RUSSIAN_POST: 'Почта России' };
const PAYMENT_LABELS = { CARD: 'банковская карта', SBP: 'СБП / SberPay / T-Pay' };

/**
 * Формирует и отправляет сообщение о новом заказе в Telegram-чат/канал администратора.
 * Использует голый Bot API через fetch — отдельная библиотека не нужна для
 * одного метода sendMessage.
 * @param {import('@prisma/client').Order & { items: import('@prisma/client').OrderItem[] }} order
 */
export async function notifyTelegramNewOrder(order) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — уведомление в Telegram пропущено');
    return;
  }

  const itemsText = order.items
    .map((i) => `— ${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty} = ${formatPrice(i.price * i.qty)}`)
    .join('\n');

  const text = [
    `🛒 *Новый заказ ${order.orderNumber}*`,
    '',
    `Клиент: ${order.fullName}`,
    `Телефон: +${order.phoneCallingCode} ${order.phone}`,
    `Доставка: ${DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}`,
    `Оплата: ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}`,
    `Город: ${order.city}`,
    `Адрес: ${order.address}`,
    order.comment ? `Комментарий: ${order.comment}` : null,
    order.promoCode ? `Промокод: ${order.promoCode}` : null,
    '',
    'Состав заказа:',
    itemsText,
    '',
    `Итого: *${formatPrice(order.totalPrice)}*`,
  ]
    .filter(Boolean)
    .join('\n');

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'Markdown' }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('Telegram API ответил с ошибкой:', response.status, body);
  }
}
