import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// nodemailer подменяем до загрузки email.js, чтобы не ходить в настоящий SMTP.
const sendMail = mock.fn(async () => ({}));
mock.module('nodemailer', {
  defaultExport: { createTransport: () => ({ sendMail }) },
});

const { buildTelegramText, notifyTelegramNewOrder } = await import('../src/lib/telegram.js');
const { buildEmailHtml, buildEmailText, notifyEmailNewOrder } = await import('../src/lib/email.js');

const makeOrder = (overrides = {}) => ({
  orderNumber: 'LG-260919-ABC123',
  fullName: 'Иван_Иванов *Тест* [x]',
  phoneCallingCode: '7',
  phone: '9001234567',
  deliveryType: 'CDEK',
  paymentMethod: 'CARD',
  city: 'Москва',
  address: 'ул. Тверская, 1 <b>кв.5</b> & подъезд_2',
  comment: 'Позвоните <script>alert(1)</script>',
  promoCode: null,
  totalPrice: 3600,
  items: [{ name: 'T-shirt "Eminem"', size: 'M', qty: 2, price: 1800 }],
  ...overrides,
});

const ENV_KEYS = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'SMTP_HOST', 'ADMIN_EMAIL', 'SMTP_USER'];
let savedEnv;
beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  sendMail.mock.resetCalls();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  mock.restoreAll();
});

describe('Telegram', () => {
  it('экранирует HTML в пользовательских полях', () => {
    const text = buildTelegramText(makeOrder());
    assert.match(text, /Иван_Иванов \*Тест\* \[x\]/); // в HTML-режиме _ * [ безопасны
    assert.match(text, /&lt;b&gt;кв\.5&lt;\/b&gt; &amp; подъезд_2/);
    assert.match(text, /&lt;script&gt;/);
    assert.doesNotMatch(text, /<script>/);
  });

  it('телефон без двойного плюса, даже если код пришёл с «+»', () => {
    assert.match(buildTelegramText(makeOrder()), /Телефон: \+7 9001234567/);
    assert.match(buildTelegramText(makeOrder({ phoneCallingCode: '+7' })), /Телефон: \+7 9001234567/);
  });

  it('не превышает лимит Telegram в 4096 символов', () => {
    const items = Array.from({ length: 30 }, (_, n) => ({
      name: `Очень длинное название товара номер ${n} `.repeat(6),
      size: 'M',
      qty: 20,
      price: 1800,
    }));
    const text = buildTelegramText(makeOrder({ items, comment: 'x'.repeat(5000) }));
    assert.ok(text.length <= 4096, `длина ${text.length}`);
    assert.match(text, /… и ещё \d+ поз\./);
  });

  it('отправляет sendMessage с parse_mode=HTML', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'TOKEN';
    process.env.TELEGRAM_CHAT_ID = '-100500';
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{"ok":true}'));

    await notifyTelegramNewOrder(makeOrder());

    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, opts] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, 'https://api.telegram.org/botTOKEN/sendMessage');
    const body = JSON.parse(opts.body);
    assert.equal(body.chat_id, '-100500');
    assert.equal(body.parse_mode, 'HTML');
    assert.match(body.text, /Новый заказ LG-260919-ABC123/);
  });

  it('бросает ошибку, если Telegram ответил не 2xx (её залогирует роут)', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'TOKEN';
    process.env.TELEGRAM_CHAT_ID = '1';
    mock.method(globalThis, 'fetch', async () => new Response('{"ok":false}', { status: 400 }));
    await assert.rejects(notifyTelegramNewOrder(makeOrder()), /Telegram API ответил 400/);
  });

  it('без токена/чата молча пропускается и не делает запросов', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    mock.method(console, 'warn', () => {});
    const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{}'));
    await notifyTelegramNewOrder(makeOrder());
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});

describe('Email', () => {
  it('экранирует HTML в письме', () => {
    const html = buildEmailHtml(makeOrder());
    assert.doesNotMatch(html, /<script>/);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;b&gt;кв\.5&lt;\/b&gt; &amp; подъезд_2/);
  });

  it('текстовая версия содержит состав и итог', () => {
    const text = buildEmailText(makeOrder());
    assert.match(text, /T-shirt "Eminem" \(M\) × 2/);
    assert.match(text, /Итого: 3.?600₽/);
  });

  it('отправляет письмо админу с html и text', async () => {
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_USER = 'orders@legashion.ru';
    process.env.ADMIN_EMAIL = 'admin@legashion.ru';

    await notifyEmailNewOrder(makeOrder());

    assert.equal(sendMail.mock.callCount(), 1);
    const mail = sendMail.mock.calls[0].arguments[0];
    assert.equal(mail.to, 'admin@legashion.ru');
    assert.equal(mail.subject, 'Новый заказ LG-260919-ABC123 — legashion');
    assert.ok(mail.html && mail.text);
  });

  it('без SMTP/ADMIN_EMAIL письмо не отправляется', async () => {
    delete process.env.ADMIN_EMAIL;
    mock.method(console, 'warn', () => {});
    await notifyEmailNewOrder(makeOrder());
    assert.equal(sendMail.mock.callCount(), 0);
  });
});
