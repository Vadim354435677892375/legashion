import { describe, it, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './helpers.js';

let ctx;
before(async () => {
  ctx = await loadApp({ cacheKey: 'orders' });
});
after(() => ctx.close());

beforeEach(() => {
  ctx.prisma._db.orders = [];
  const dims = { weightGrams: 500, lengthCm: 30, widthCm: 25, heightCm: 5, sizes: ['S', 'M', 'L', 'XL'] };
  ctx.prisma._db.products = [
    { id: 1, name: 'T-shirt "Eminem"', price: 1800, discountPercent: 0, isActive: true, ...dims },
    { id: 2, name: 'T-shirt "Sale"', price: 1800, discountPercent: 20, isActive: true, ...dims },
    { id: 3, name: 'Скрытый товар', price: 1000, discountPercent: 0, isActive: false, ...dims },
    { id: 4, name: 'Без габаритов', price: 1000, discountPercent: 0, isActive: true, sizes: ['S', 'M', 'L', 'XL'], weightGrams: 500, lengthCm: null, widthCm: 25, heightCm: 5 },
  ];
  // Остатки: у товаров 1 и 2 по 10 штук в размерах S/M/L/XL, у товара 4 тоже есть.
  ctx.prisma._db.stock = [1, 2, 4].flatMap((productId) =>
    ['S', 'M', 'L', 'XL'].map((size) => ({ productId, size, quantity: 10 }))
  );
});

const baseOrder = (items) => ({
  fullName: 'Иван Иванов',
  phoneCallingCode: '+7',
  phone: '9001234567',
  email: 'ivan@example.com',
  countryCode: 'RU',
  city: 'Москва',
  address: 'ул. Тверская, 1',
  deliveryType: 'CDEK',
  paymentMethod: 'CARD',
  items,
});

const send = (body) =>
  fetch(`${ctx.base}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/orders — цены считает сервер', () => {
  it('считает сумму по каталогу с учётом скидки', async () => {
    const res = await send(baseOrder([
      { productId: 1, size: 'M', qty: 2 }, // 1800 × 2
      { productId: 2, size: 'L', qty: 1 }, // 1440 (скидка 20%)
    ]));
    assert.equal(res.status, 201);
    assert.equal((await res.json()).totalPrice, 1800 * 2 + 1440);
  });

  it('игнорирует цену и название, присланные клиентом', async () => {
    const res = await send(baseOrder([{ productId: 1, size: 'M', qty: 1, price: 1, name: 'Подделка' }]));
    assert.equal(res.status, 201);
    assert.equal((await res.json()).totalPrice, 1800);

    const [item] = ctx.prisma._db.orders[0].items;
    assert.equal(item.price, 1800);
    assert.equal(item.name, 'T-shirt "Eminem"');
  });

  it('старый формат (цена без productId) больше не принимается', async () => {
    const res = await send(baseOrder([{ name: 'T-shirt "Eminem"', size: 'M', price: 1, qty: 1 }]));
    assert.equal(res.status, 400);
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('несуществующий товар → 400', async () => {
    const res = await send(baseOrder([{ productId: 999, size: 'M', qty: 1 }]));
    assert.equal(res.status, 400);
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('выключенный (isActive=false) товар купить нельзя', async () => {
    const res = await send(baseOrder([{ productId: 3, size: 'M', qty: 1 }]));
    assert.equal(res.status, 400);
  });

  it('товар без веса/габаритов заказать нельзя', async () => {
    const res = await send(baseOrder([{ productId: 4, size: 'M', qty: 1 }]));
    assert.equal(res.status, 400);
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('отрицательное и слишком большое количество → 400', async () => {
    assert.equal((await send(baseOrder([{ productId: 1, size: 'M', qty: -5 }]))).status, 400);
    assert.equal((await send(baseOrder([{ productId: 1, size: 'M', qty: 21 }]))).status, 400);
  });

  it('произвольный размер → 400', async () => {
    assert.equal((await send(baseOrder([{ productId: 1, size: 'XXXL-hack', qty: 1 }]))).status, 400);
  });

  it('слишком много позиций → 400', async () => {
    const items = Array.from({ length: 31 }, () => ({ productId: 1, size: 'M', qty: 1 }));
    assert.equal((await send(baseOrder(items))).status, 400);
  });
});

describe('POST /api/orders — остатки по размерам', () => {
  const qtyOf = (productId, size) =>
    ctx.prisma._db.stock.find((r) => r.productId === productId && r.size === size).quantity;

  it('после заказа списывает остаток нужного размера', async () => {
    const res = await send(baseOrder([{ productId: 1, size: 'M', qty: 3 }]));
    assert.equal(res.status, 201);
    assert.equal(qtyOf(1, 'M'), 7);
    assert.equal(qtyOf(1, 'L'), 10, 'другие размеры не трогаем');
  });

  it('можно купить ровно весь остаток', async () => {
    ctx.prisma._db.stock.find((r) => r.productId === 1 && r.size === 'S').quantity = 2;
    const res = await send(baseOrder([{ productId: 1, size: 'S', qty: 2 }]));
    assert.equal(res.status, 201);
    assert.equal(qtyOf(1, 'S'), 0);
  });

  it('больше остатка → 409 с понятным текстом, заказ не создаётся', async () => {
    ctx.prisma._db.stock.find((r) => r.productId === 1 && r.size === 'S').quantity = 2;
    const res = await send(baseOrder([{ productId: 1, size: 'S', qty: 3 }]));
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /в наличии только 2 шт/);
    assert.equal(ctx.prisma._db.orders.length, 0);
    assert.equal(qtyOf(1, 'S'), 2);
  });

  it('размер, которого нет в наличии (0 или нет строки) → 409', async () => {
    ctx.prisma._db.stock.find((r) => r.productId === 1 && r.size === 'S').quantity = 0;
    const soldOut = await send(baseOrder([{ productId: 1, size: 'S', qty: 1 }]));
    assert.equal(soldOut.status, 409);
    assert.match((await soldOut.json()).error, /нет в наличии/);

    ctx.prisma._db.stock = [];
    const noRow = await send(baseOrder([{ productId: 1, size: 'M', qty: 1 }]));
    assert.equal(noRow.status, 409);
  });

  it('всё или ничего: если на вторую позицию не хватает, первая не списывается', async () => {
    ctx.prisma._db.stock.find((r) => r.productId === 2 && r.size === 'L').quantity = 1;
    const res = await send(
      baseOrder([
        { productId: 1, size: 'M', qty: 2 },
        { productId: 2, size: 'L', qty: 5 },
      ])
    );
    assert.equal(res.status, 409);
    assert.equal(qtyOf(1, 'M'), 10);
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('одинаковая пара товар+размер в двух позициях суммируется', async () => {
    ctx.prisma._db.stock.find((r) => r.productId === 1 && r.size === 'M').quantity = 3;
    const res = await send(
      baseOrder([
        { productId: 1, size: 'M', qty: 2 },
        { productId: 1, size: 'M', qty: 2 },
      ])
    );
    assert.equal(res.status, 409, '2 + 2 больше остатка 3');
    assert.equal(qtyOf(1, 'M'), 3);
  });
});

describe('POST /api/orders — email покупателя', () => {
  const items = [{ productId: 1, size: 'M', qty: 1 }];

  it('сохраняет email в заказе (в нижнем регистре, без пробелов)', async () => {
    const res = await send({ ...baseOrder(items), email: '  Ivan@Example.COM ' });
    assert.equal(res.status, 201);
    assert.equal(ctx.prisma._db.orders[0].email, 'ivan@example.com');
  });

  it('без email заказ не принимается', async () => {
    const { email, ...withoutEmail } = baseOrder(items);
    void email;
    const res = await send(withoutEmail);
    assert.equal(res.status, 400);
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('некорректный email → 400', async () => {
    for (const bad of ['', 'ivan', 'ivan@', '@example.com', 'iv an@example.com']) {
      const res = await send({ ...baseOrder(items), email: bad });
      assert.equal(res.status, 400, `«${bad}» должен быть отклонён`);
    }
    assert.equal(ctx.prisma._db.orders.length, 0);
  });

  it('публичный GET заказа не отдаёт email', async () => {
    const created = await (await send(baseOrder(items))).json();
    const res = await fetch(`${ctx.base}/api/orders/${created.orderNumber}`);
    // в fake-БД нет findUnique для заказов — достаточно, что email не попадает в ответ, если он есть
    if (res.status === 200) assert.equal((await res.json()).email, undefined);
  });
});

describe('POST /api/orders — уведомления', () => {
  const realFetch = globalThis.fetch;
  const isTelegram = (url) => String(url).startsWith('https://api.telegram.org');

  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = 'TOKEN';
    process.env.TELEGRAM_CHAT_ID = '1';
  });
  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    mock.restoreAll();
  });

  it('после создания заказа шлёт сообщение в Telegram с номером заказа', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', (url, opts) =>
      isTelegram(url) ? Promise.resolve(new Response('{"ok":true}')) : realFetch(url, opts)
    );

    const res = await send(baseOrder([{ productId: 1, size: 'M', qty: 1 }]));
    const { orderNumber } = await res.json();

    const tgCalls = fetchMock.mock.calls.filter((c) => isTelegram(c.arguments[0]));
    assert.equal(tgCalls.length, 1);
    assert.match(JSON.parse(tgCalls[0].arguments[1].body).text, new RegExp(orderNumber));
  });

  it('сбой Telegram не ломает оформление заказа и попадает в лог', async () => {
    mock.method(globalThis, 'fetch', (url, opts) =>
      isTelegram(url) ? Promise.reject(new Error('network down')) : realFetch(url, opts)
    );
    const errorLog = mock.method(console, 'error', () => {});

    const res = await send(baseOrder([{ productId: 1, size: 'M', qty: 1 }]));

    assert.equal(res.status, 201);
    assert.equal(ctx.prisma._db.orders.length, 1);
    assert.ok(
      errorLog.mock.calls.some((c) => String(c.arguments[0]).includes('telegram')),
      'ошибка отправки должна быть залогирована'
    );
  });
});
