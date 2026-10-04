import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFakePrisma } from './fakePrisma.js';
import { buildStockRows, serializeStock, releaseStock, reserveStock } from '../src/lib/stock.js';

describe('buildStockRows', () => {
  it('по строке на каждый размер товара, не указанный = 0, лишние размеры отбрасываются', () => {
    const rows = buildStockRows(['S', 'M'], { S: 4, XXL: 9 });
    assert.deepEqual(rows, [
      { size: 'S', quantity: 4 },
      { size: 'M', quantity: 0 },
    ]);
  });

  it('товар без размеров — одна строка с size = "" и общим количеством', () => {
    assert.deepEqual(buildStockRows([], { S: 4 }, 7), [{ size: '', quantity: 7 }]);
  });
});

describe('serializeStock', () => {
  it('для товара с размерами отдаёт карту размер → штуки (нет строки → 0)', () => {
    const out = serializeStock({ sizes: ['S', 'M'], stock: [{ size: 'S', quantity: 3 }] });
    assert.deepEqual(out, { stock: { S: 3, M: 0 }, quantity: null });
  });

  it('для товара без размеров отдаёт quantity', () => {
    const out = serializeStock({ sizes: [], stock: [{ size: '', quantity: 5 }] });
    assert.deepEqual(out, { stock: {}, quantity: 5 });
  });

  it('строки размеров, которых у товара уже нет, наружу не попадают', () => {
    const out = serializeStock({ sizes: ['M'], stock: [{ size: 'XL', quantity: 9 }] });
    assert.deepEqual(out, { stock: { M: 0 }, quantity: null });
  });
});

describe('reserveStock / releaseStock', () => {
  const setup = () => {
    const prisma = createFakePrisma();
    prisma._db.stock = [
      { productId: 1, size: 'M', quantity: 5 },
      { productId: 2, size: '', quantity: 2 },
    ];
    return prisma;
  };

  it('списывает и возвращает остаток, в том числе у товара без размера', async () => {
    const prisma = setup();
    const items = [
      { productId: 1, size: 'M', qty: 3, name: 'Худи' },
      { productId: 2, size: null, qty: 2, name: 'Кепка' },
    ];
    await prisma.$transaction((tx) => reserveStock(tx, items));
    assert.deepEqual(prisma._db.stock.map((r) => r.quantity), [2, 0]);

    await prisma.$transaction((tx) => releaseStock(tx, items));
    assert.deepEqual(prisma._db.stock.map((r) => r.quantity), [5, 2]);
  });

  it('позиция удалённого товара (productId null) при возврате пропускается', async () => {
    const prisma = setup();
    await prisma.$transaction((tx) => releaseStock(tx, [{ productId: null, size: 'M', qty: 3 }]));
    assert.deepEqual(prisma._db.stock.map((r) => r.quantity), [5, 2]);
  });

  it('нехватка → 409, транзакция откатывается целиком', async () => {
    const prisma = setup();
    const items = [
      { productId: 1, size: 'M', qty: 2, name: 'Худи' },
      { productId: 2, size: null, qty: 3, name: 'Кепка' },
    ];
    await assert.rejects(
      prisma.$transaction((tx) => reserveStock(tx, items)),
      (err) => err.status === 409 && /в наличии только 2 шт/.test(err.message)
    );
    assert.deepEqual(prisma._db.stock.map((r) => r.quantity), [5, 2]);
  });
});
