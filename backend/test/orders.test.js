import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './helpers.js';

let ctx;
before(async () => {
  ctx = await loadApp({ cacheKey: 'orders' });
});
after(() => ctx.close());

beforeEach(() => {
  ctx.prisma._db.orders = [];
  ctx.prisma._db.products = [
    { id: 1, name: 'T-shirt "Eminem"', price: 1800, discountPercent: 0, isActive: true },
    { id: 2, name: 'T-shirt "Sale"', price: 1800, discountPercent: 20, isActive: true },
    { id: 3, name: 'Скрытый товар', price: 1000, discountPercent: 0, isActive: false },
  ];
});

const baseOrder = (items) => ({
  fullName: 'Иван Иванов',
  phoneCallingCode: '+7',
  phone: '9001234567',
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
