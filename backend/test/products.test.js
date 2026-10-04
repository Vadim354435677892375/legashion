import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './helpers.js';

let ctx;
before(async () => {
  ctx = await loadApp({ cacheKey: 'products' });
});
after(() => ctx.close());

const base = {
  price: 1000,
  discountPercent: 0,
  isActive: true,
  sizes: ['S', 'M'],
  stock: [
    { size: 'S', quantity: 3 },
    { size: 'M', quantity: 0 },
  ],
  images: [],
  collections: [],
};
const dims = { weightGrams: 500, lengthCm: 30, widthCm: 25, heightCm: 5 };

beforeEach(() => {
  ctx.prisma._db.products = [
    { ...base, id: 1, name: 'С габаритами', ...dims },
    { ...base, id: 2, name: 'Без веса', ...dims, weightGrams: null },
    { ...base, id: 3, name: 'Без длины', ...dims, lengthCm: null },
    { ...base, id: 4, name: 'Нулевая высота', ...dims, heightCm: 0 },
    { ...base, id: 5, name: 'Совсем без данных' },
  ];
});

describe('публичный каталог показывает остатки по размерам', () => {
  it('stock — штуки по каждому размеру, у товара без размеров — quantity', async () => {
    const card = await (await fetch(`${ctx.base}/api/products/1`)).json();
    assert.deepEqual(card.stock, { S: 3, M: 0 });
    assert.equal(card.quantity, null);

    ctx.prisma._db.products.push({
      ...base,
      id: 9,
      name: 'Кепка',
      ...dims,
      sizes: [],
      stock: [{ size: '', quantity: 4 }],
    });
    const cap = await (await fetch(`${ctx.base}/api/products/9`)).json();
    assert.deepEqual(cap.stock, {});
    assert.equal(cap.quantity, 4);
  });

  it('размер без строки остатка считается «0 шт.»', async () => {
    ctx.prisma._db.products[0].stock = [{ size: 'S', quantity: 3 }];
    const card = await (await fetch(`${ctx.base}/api/products/1`)).json();
    assert.deepEqual(card.stock, { S: 3, M: 0 });
  });
});

describe('публичный каталог скрывает товары без веса и габаритов', () => {
  it('в списке только товары со всеми четырьмя значениями', async () => {
    const list = await (await fetch(`${ctx.base}/api/products`)).json();
    assert.deepEqual(list.map((p) => p.id), [1]);
  });

  it('карточка товара без габаритов → 404', async () => {
    for (const id of [2, 3, 4, 5]) {
      const res = await fetch(`${ctx.base}/api/products/${id}`);
      assert.equal(res.status, 404, `товар ${id} должен быть скрыт`);
    }
    assert.equal((await fetch(`${ctx.base}/api/products/1`)).status, 200);
  });

  it('вес и габариты не попадают в публичный ответ', async () => {
    const [product] = await (await fetch(`${ctx.base}/api/products`)).json();
    for (const field of ['weightGrams', 'lengthCm', 'widthCm', 'heightCm']) {
      assert.equal(field in product, false, `${field} не должен отдаваться на сайт`);
    }
    const card = await (await fetch(`${ctx.base}/api/products/1`)).json();
    for (const field of ['weightGrams', 'lengthCm', 'widthCm', 'heightCm']) {
      assert.equal(field in card, false);
    }
  });
});
