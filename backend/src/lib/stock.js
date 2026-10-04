import { HttpError } from '../middleware/errorHandler.js';

// Остатки по размерам. В таблице ProductStock size = '' означает «товар без размеров».
export const NO_SIZE = '';

/**
 * Строки остатков для сохранения товара: по одной на каждый размер из `sizes`
 * (количество берём из `stock`, не указано — 0). У товара без размеров — одна строка
 * с общим `quantity`. Лишние ключи в `stock` (размеры, которых у товара нет) отбрасываются.
 */
export function buildStockRows(sizes, stock = {}, quantity = 0) {
  if (sizes.length === 0) return [{ size: NO_SIZE, quantity }];
  return sizes.map((size) => ({ size, quantity: stock[size] ?? 0 }));
}

/**
 * Превращает строки ProductStock в поля ответа API:
 *  - stock: { S: 3, M: 0 } — по каждому размеру товара (нет строки → 0);
 *  - quantity: число для товара без размеров, иначе null.
 */
export function serializeStock(product) {
  const rows = product.stock ?? [];
  const bySize = new Map(rows.map((r) => [r.size, r.quantity]));
  const sizes = product.sizes ?? [];

  if (sizes.length === 0) {
    return { stock: {}, quantity: bySize.get(NO_SIZE) ?? 0 };
  }
  return {
    stock: Object.fromEntries(sizes.map((s) => [s, bySize.get(s) ?? 0])),
    quantity: null,
  };
}

/** Склеивает позиции с одинаковым товаром и размером (в заказе одна пара может встретиться дважды). */
function aggregate(items) {
  const map = new Map();
  for (const i of items) {
    if (i.productId == null) continue; // товар уже удалён из каталога — возвращать некуда
    const size = i.size ?? NO_SIZE;
    const key = `${i.productId}\u0000${size}`;
    const entry = map.get(key) ?? { productId: i.productId, size, qty: 0, name: i.name };
    entry.qty += i.qty;
    map.set(key, entry);
  }
  // Стабильный порядок блокировок строк — чтобы два параллельных заказа не взяли их навстречу друг другу.
  return [...map.values()].sort((a, b) => a.productId - b.productId || a.size.localeCompare(b.size));
}

/**
 * Списывает остаток под заказ. Вызывать ВНУТРИ транзакции (tx): если чего-то не хватает,
 * бросается HttpError(409), и вся транзакция (в т.ч. создание заказа) откатывается.
 * Списание атомарное: условие «quantity >= qty» проверяется самой БД в том же UPDATE,
 * поэтому два одновременных заказа не смогут вместе купить последнюю штуку.
 */
export async function reserveStock(tx, items) {
  for (const { productId, size, qty, name } of aggregate(items)) {
    const { count } = await tx.productStock.updateMany({
      where: { productId, size, quantity: { gte: qty } },
      data: { quantity: { decrement: qty } },
    });
    if (count > 0) continue;

    const row = await tx.productStock.findFirst({ where: { productId, size } });
    const available = row?.quantity ?? 0;
    const label = `«${name}»${size ? ` (${size})` : ''}`;
    throw new HttpError(
      409,
      available > 0
        ? `${label}: в наличии только ${available} шт. Уменьшите количество в корзине`
        : `${label}: нет в наличии. Уберите товар из корзины`
    );
  }
}

/** Возвращает остаток на склад (отмена заказа). Для размера, которого в таблице уже нет, ничего не делает. */
export async function releaseStock(tx, items) {
  for (const { productId, size, qty } of aggregate(items)) {
    await tx.productStock.updateMany({
      where: { productId, size },
      data: { quantity: { increment: qty } },
    });
  }
}
