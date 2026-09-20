// Реестр «слотов» — мест на сайте, где картинку можно заменить из админки.
// Ключ (key) зашит и в компоненты фронта (useSiteMedia().get('models.look-1', ...)),
// поэтому существующие ключи переименовывать нельзя. Чтобы сделать заменяемой ещё одну
// картинку: добавь запись сюда и возьми её на фронте через useSiteMedia — больше нигде
// ничего менять не надо (ни в БД, ни в админке: она рисуется по этому списку).
//
// Поле collection (slug коллекции) — слот относится к конкретной коллекции: в админке он
// показывается не на вкладке «Медиа», а в форме этой коллекции (вкладка «Коллекции»);
// collectionLabel — подпись слота там. Слоты без collection остаются на вкладке «Медиа».
//
// В БД (SiteMedia) лежат только переопределения. Нет записи → сайт показывает
// встроенную картинку из frontend/src/assets либо серый плейсхолдер.

export const MEDIA_SLOTS = [
  {
    key: 'intro.background',
    group: 'Заставка и логотип',
    label: 'Фон заставки (экран ENTER)',
    hint: 'На весь экран. Подойдёт GIF или JPG/PNG/WebP.',
  },
  {
    key: 'brand.logo',
    group: 'Заставка и логотип',
    label: 'Логотип LEGASHION',
    hint: 'Заставка, оформление заказа, страницы Archive и коллекций. Лучше PNG/GIF с прозрачным фоном.',
  },

  {
    key: 'categories.new-collection',
    collection: 'new-collection',
    collectionLabel: 'Карточка на главной',
    group: 'Главная — карточки категорий',
    label: 'New Collection',
    hint: 'Пропорции карточки 3:3.5 (вертикальное фото).',
  },
  {
    key: 'categories.archive',
    collection: 'archive',
    collectionLabel: 'Карточка на главной',
    group: 'Главная — карточки категорий',
    label: 'Archive',
    hint: 'Пропорции карточки 3:3.5 (вертикальное фото).',
  },
  {
    key: 'categories.sale',
    collection: 'sale',
    collectionLabel: 'Карточка на главной',
    group: 'Главная — карточки категорий',
    label: 'Sale',
    hint: 'Пропорции карточки 3:3.5 (вертикальное фото).',
  },
  {
    key: 'categories.longsleeves',
    group: 'Главная — карточки категорий',
    label: 'Лонгсливы',
    hint: 'Пропорции карточки 3:3.5 (вертикальное фото).',
  },
  {
    key: 'categories.tshirts',
    collection: 'tshirts',
    collectionLabel: 'Карточка на главной',
    group: 'Главная — карточки категорий',
    label: 'Футболки',
    hint: 'Пропорции карточки 3:3.5 (вертикальное фото).',
  },

  {
    key: 'models.look-1',
    group: 'Главная — фото моделей (окно Paint)',
    label: 'Look 1',
    hint: 'Обрезается по центру под рамку окна.',
  },
  {
    key: 'models.look-2',
    group: 'Главная — фото моделей (окно Paint)',
    label: 'Look 2',
    hint: 'Обрезается по центру под рамку окна.',
  },
  {
    key: 'models.look-3',
    group: 'Главная — фото моделей (окно Paint)',
    label: 'Look 3',
    hint: 'Обрезается по центру под рамку окна.',
  },

  {
    key: 'tshirts.hero',
    collection: 'tshirts',
    collectionLabel: 'Фото сверху страницы «Футболки»',
    group: 'Страница «Футболки»',
    label: 'Фото футболки сверху страницы',
    hint: 'Квадрат 1:1.',
  },

  {
    key: 'archive.banner-1',
    collection: 'archive',
    collectionLabel: 'Слайд 1 баннера на странице Archive',
    group: 'Страница Archive — баннер-карусель',
    label: 'Слайд 1',
    hint: 'Горизонтальное фото, около 620×320.',
  },
  {
    key: 'archive.banner-2',
    collection: 'archive',
    collectionLabel: 'Слайд 2 баннера на странице Archive',
    group: 'Страница Archive — баннер-карусель',
    label: 'Слайд 2',
    hint: 'Горизонтальное фото, около 620×320.',
  },
  {
    key: 'archive.banner-3',
    collection: 'archive',
    collectionLabel: 'Слайд 3 баннера на странице Archive',
    group: 'Страница Archive — баннер-карусель',
    label: 'Слайд 3',
    hint: 'Горизонтальное фото, около 620×320.',
  },
  {
    key: 'archive.banner-4',
    collection: 'archive',
    collectionLabel: 'Слайд 4 баннера на странице Archive',
    group: 'Страница Archive — баннер-карусель',
    label: 'Слайд 4',
    hint: 'Горизонтальное фото, около 620×320.',
  },
];

export const SLOT_KEYS = new Set(MEDIA_SLOTS.map((s) => s.key));

// Коллекции, у которых своя отдельная страница без блока промо-видео
// (Sale/Archive/Футболки) — для них поле «промо-видео» в админке не показываем.
// Все остальные коллекции открываются через общую CollectionPage с видео-баннером.
export const COLLECTIONS_WITHOUT_VIDEO_BANNER = ['home', 'sale', 'archive', 'tshirts'];

export const hasVideoBanner = (slug) => !COLLECTIONS_WITHOUT_VIDEO_BANNER.includes(slug);
