// Общие данные для страниц коллекций (CollectionPage, маршрут
// /collection/:slug) — используются и на самой странице (сетка карточек),
// и на ProductPage (карточка товара), чтобы название и цена совпадали.
// Когда появится реальный каталог — заменить на данные с бэкенда
// (загружать коллекцию по slug).

export const COLLECTIONS = {
  'new-collection': {
    title: 'NEW COLLECTION',
    marquee: 'NEW COLLECTION',
    items: [
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
      { name: 'T-shirt "Eminem"', price: 1800, image: null },
    ],
  },
};