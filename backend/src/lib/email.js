import nodemailer from 'nodemailer';
import {
  DELIVERY_LABELS,
  PAYMENT_LABELS,
  NOTIFY_TIMEOUT_MS,
  escapeHtml,
  formatItemName,
  formatPhone,
  formatPrice,
} from './orderFormat.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Без таймаутов недоступный SMTP-сервер подвесил бы ответ на оформление заказа.
    connectionTimeout: NOTIFY_TIMEOUT_MS,
    greetingTimeout: NOTIFY_TIMEOUT_MS,
    socketTimeout: NOTIFY_TIMEOUT_MS,
  });
  return transporter;
}

const e = escapeHtml;

/** HTML-версия письма. Все данные клиента экранируются. */
export function buildEmailHtml(order) {
  const itemsRows = order.items
    .map(
      (i) =>
        `<tr><td>${e(formatItemName(i))}</td><td>${i.qty}</td><td>${formatPrice(i.price * i.qty)}</td></tr>`
    )
    .join('');

  return `
    <h2>Новый заказ ${e(order.orderNumber)}</h2>
    <p><b>Клиент:</b> ${e(order.fullName)}<br/>
    <b>Телефон:</b> ${e(formatPhone(order))}<br/>
    <b>Доставка:</b> ${e(DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType)}<br/>
    <b>Оплата:</b> ${e(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}<br/>
    <b>Город:</b> ${e(order.city)}<br/>
    <b>Адрес:</b> ${e(order.address)}<br/>
    ${order.comment ? `<b>Комментарий:</b> ${e(order.comment)}<br/>` : ''}
    ${order.promoCode ? `<b>Промокод:</b> ${e(order.promoCode)}<br/>` : ''}
    </p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <p><b>Итого: ${formatPrice(order.totalPrice)}</b></p>
  `;
}

/** Текстовая версия письма — для клиентов без HTML и как альтернатива для антиспама. */
export function buildEmailText(order) {
  return [
    `Новый заказ ${order.orderNumber}`,
    '',
    `Клиент: ${order.fullName}`,
    `Телефон: ${formatPhone(order)}`,
    `Доставка: ${DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}`,
    `Оплата: ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}`,
    `Город: ${order.city}`,
    `Адрес: ${order.address}`,
    order.comment ? `Комментарий: ${order.comment}` : null,
    order.promoCode ? `Промокод: ${order.promoCode}` : null,
    '',
    'Состав заказа:',
    ...order.items.map((i) => `— ${formatItemName(i)} × ${i.qty} = ${formatPrice(i.price * i.qty)}`),
    '',
    `Итого: ${formatPrice(order.totalPrice)}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Отправляет email администратору о новом заказе.
 * ADMIN_EMAIL может содержать несколько адресов через запятую.
 * @param {import('@prisma/client').Order & { items: import('@prisma/client').OrderItem[] }} order
 */
export async function notifyEmailNewOrder(order) {
  const t = getTransporter();
  if (!t || !process.env.ADMIN_EMAIL) {
    console.warn('SMTP или ADMIN_EMAIL не настроены — email-уведомление пропущено');
    return;
  }

  await t.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `Новый заказ ${order.orderNumber} — legashion`,
    text: buildEmailText(order),
    html: buildEmailHtml(order),
  });
}
