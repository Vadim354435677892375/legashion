import { prisma } from './prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { getDiscountedPrice } from './pricing.js';
import { assertPromoUsable, calcPromoDiscount, normalizePromoCode } from './promo.js';

/**
 * Собирает позиции заказа по актуальному каталогу: цену и название берём из БД,
 * а размер проверяем по списку размеров товара (product.sizes).
 * Клиентским данным не доверяем — это общая логика для оформления заказа и
 * для предпросмотра скидки по промокоду.
 */
export async function priceOrderItems(rawItems) {
  const productIds = [...new Set(rawItems.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const items = rawItems.map((i) => {
    const product = productById.get(i.productId);
    if (!product) {
      throw new HttpError(400, 'Один из товаров в корзине больше недоступен. Обновите корзину');
    }

    const sizes = product.sizes ?? [];
    let size = null;
    if (sizes.length > 0) {
      if (!i.size) throw new HttpError(400, `Выберите размер для «${product.name}»`);
      if (!sizes.includes(i.size)) {
        throw new HttpError(400, `Размера ${i.size} у «${product.name}» нет. Обновите корзину`);
      }
      size = i.size;
    }

    return {
      productId: product.id,
      name: product.name,
      size,
      price: getDiscountedPrice(product.price, product.discountPercent),
      qty: i.qty,
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { items, subtotal };
}

/**
 * Находит промокод и считает скидку для заданной суммы. Без кода возвращает promo: null.
 * Если код не подходит — бросает HttpError(400) с текстом для покупателя.
 */
export async function resolvePromo(rawCode, subtotal) {
  const code = normalizePromoCode(rawCode);
  if (!code) return { promo: null, discountAmount: 0 };

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  assertPromoUsable(promo);
  return { promo, discountAmount: calcPromoDiscount(promo, subtotal) };
}
