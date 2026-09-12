// Раньше getDiscountedPrice жила в pages/sale_page/saleItems.js вместе с
// захардкоженными товарами; formatPrice дублировался почти в каждой странице.
// Теперь, когда товары приходят с бэкенда, обе функции — общий утил.

export function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')}\u20BD`;
}

export function getDiscountedPrice(price, discountPercent) {
  return Math.round(price * (1 - discountPercent / 100));
}
