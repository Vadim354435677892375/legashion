// Цена со скидкой. Формула та же, что в frontend/src/utils/pricing.js, —
// иначе цена в корзине и итог заказа могли бы расходиться на рубль из-за округления.
export function getDiscountedPrice(price, discountPercent) {
  return Math.round(price * (1 - discountPercent / 100));
}
