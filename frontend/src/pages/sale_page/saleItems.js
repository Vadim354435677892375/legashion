// Общие данные товаров раздела Sale — используются и на странице SalePage
// (сетка карточек), и на ProductPage (карточка товара), чтобы цена и
// скидка были одинаковыми в обоих местах.
// Когда появится реальный каталог — заменить на данные с бэкенда.

export const SALE_ITEMS = [
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, discount: 20, image: null },
];

export function getDiscountedPrice(price, discount) {
  return Math.round(price * (1 - discount / 100));
}