import nodemailer from 'nodemailer';

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
  });
  return transporter;
}

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}\u20BD`;
}

const DELIVERY_LABELS = { CDEK: 'СДЭК', RUSSIAN_POST: 'Почта России' };
const PAYMENT_LABELS = { CARD: 'банковская карта', SBP: 'СБП / SberPay / T-Pay' };

/**
 * Отправляет email администратору о новом заказе.
 * @param {import('@prisma/client').Order & { items: import('@prisma/client').OrderItem[] }} order
 */
export async function notifyEmailNewOrder(order) {
  const t = getTransporter();
  if (!t || !process.env.ADMIN_EMAIL) {
    console.warn('SMTP или ADMIN_EMAIL не настроены — email-уведомление пропущено');
    return;
  }

  const itemsRows = order.items
    .map(
      (i) =>
        `<tr><td>${i.name}${i.size ? ` (${i.size})` : ''}</td><td>${i.qty}</td><td>${formatPrice(
          i.price * i.qty
        )}</td></tr>`
    )
    .join('');

  const html = `
    <h2>Новый заказ ${order.orderNumber}</h2>
    <p><b>Клиент:</b> ${order.fullName}<br/>
    <b>Телефон:</b> +${order.phoneCallingCode} ${order.phone}<br/>
    <b>Доставка:</b> ${DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}<br/>
    <b>Оплата:</b> ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}<br/>
    <b>Город:</b> ${order.city}<br/>
    <b>Адрес:</b> ${order.address}<br/>
    ${order.comment ? `<b>Комментарий:</b> ${order.comment}<br/>` : ''}
    ${order.promoCode ? `<b>Промокод:</b> ${order.promoCode}<br/>` : ''}
    </p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <p><b>Итого: ${formatPrice(order.totalPrice)}</b></p>
  `;

  await t.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `Новый заказ ${order.orderNumber} — legashion`,
    html,
  });
}
