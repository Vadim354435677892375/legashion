# legashion — backend

REST API для магазина legashion: каталог товаров/коллекций, гостевые заказы
(без личного кабинета), уведомления о заказах в Telegram и на почту,
админка (JWT) для управления товарами, коллекциями, заказами и фото.

Стек: **Node.js (ESM) + Express + Prisma + PostgreSQL**. Специально написан
как обычный Node-сервер (`src/server.js`), а не «чисто serverless» — сейчас
запускается на Vercel как отдельный проект через `api/index.js`, а при
переезде на свой домен/VPS достаточно `npm start`, никакого переписывания
кода не требуется.

## Быстрый старт (локально)

1. Установи зависимости:
   ```bash
   npm install
   ```
2. Скопируй `.env.example` → `.env` и заполни значения (см. пояснения по
   каждому блоку прямо в файле — DaData, Yandex Object Storage, Telegram-бот,
   SMTP).
3. Подними PostgreSQL (проще всего — бесплатная база на [Neon](https://neon.tech):
   создаёшь проект, копируешь pooled-строку в `DATABASE_URL` и
   direct-строку в `DIRECT_URL`).
4. Накати миграции и создай таблицы:
   ```bash
   npm run prisma:migrate
   ```
5. Засей начальные данные (админ + перенесённые с фронта товары-заглушки):
   ```bash
   SEED_ADMIN_EMAIL=admin@legashion.ru SEED_ADMIN_PASSWORD=надёжный_пароль npm run seed
   ```
6. Запусти сервер:
   ```bash
   npm run dev
   ```
   По умолчанию слушает `http://localhost:4000`, все роуты — под `/api/...`.

## Структура

```
backend/
  api/index.js          — точка входа для Vercel (serverless-обёртка над src/app.js)
  src/
    app.js               — сборка Express-приложения (роуты, cors, error handler)
    server.js             — обычный запуск (node src/server.js) для локали/VPS
    lib/                  — Prisma-клиент, S3, Telegram, Email, DaData/Nominatim
    middleware/           — JWT-проверка админа, error handler, async-обёртка
    routes/                — публичные роуты (products, collections, orders, geocode)
    routes/admin/           — защищённые роуты админки (auth, products, collections, orders, upload)
    schemas/                — zod-схемы валидации входных данных
  prisma/
    schema.prisma           — модель БД
    seed.js                  — начальные данные
```

## Основные эндпоинты

Публичные:
- `GET  /api/products?collection=sale` — список товаров, опционально по коллекции
- `GET  /api/products/:id` — карточка товара
- `GET  /api/collections` — список коллекций (для меню категорий)
- `POST /api/orders` — оформить заказ (гостевой чекаут)
- `GET  /api/orders/:orderNumber` — проверить статус своего заказа по номеру
- `GET  /api/geocode/suggest?query=...&mode=city|address&countryCode=RU` — подсказки адреса (DaData для RU, Nominatim для остальных)

Админка (заголовок `Authorization: Bearer <token>` после логина):
- `POST /api/admin/auth/login` → `{ token }`
- `GET  /api/admin/auth/me`
- CRUD `/api/admin/products`
- CRUD `/api/admin/collections`
- `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/status`
- `POST /api/admin/upload` (form-data, поле `image`) → `{ url }` для фото Yandex Object Storage

## Деплой на Vercel (временный этап)

Разверни `backend/` как **отдельный** Vercel-проект (не смешивай с фронтом —
так домен и деплой бэкенда потом переносятся независимо, без правок
фронтенд-проекта):

1. `vercel.json` в этой папке уже настроен — все запросы идут в `api/index.js`.
2. В настройках проекта на Vercel пропиши все переменные из `.env.example`.
3. Для миграций на проде запускай `npx prisma migrate deploy` (использует
   `DIRECT_URL`) — либо локально с прод-строкой подключения, либо как
   отдельный шаг в CI. Сам рантайм-код использует `DATABASE_URL` (pooled).

## Переезд на отдельный домен/сервер

Код не меняется. На новом сервере: `npm install`, `.env`, `npm run
prisma:migrate:deploy`, `npm start`. `api/index.js` (serverless-обёртка)
просто не используется — можно даже не удалять, вреда не будет.

## Что нужно поменять на фронтенде для интеграции

Это уже не бэкенд, но чтобы магазин реально заработал на API:

1. `utils/dadata.js` и `utils/geocoding.js` — теперь адресные подсказки
   должны идти на `GET {API_URL}/api/geocode/suggest`, а не напрямую в DaData
   (ключ теперь на сервере, `VITE_DADATA_TOKEN` во фронте больше не нужен).
2. `CheckoutPage.jsx` — в `handleSubmit` вместо `setSubmitted(true)` нужен
   реальный `fetch(`${API_URL}/api/orders`, { method: 'POST', ... })`.
3. Списки товаров (`homeProducts.js`, `saleItems.js`, `tshirtItems.js`,
   `archiveItems.js`, `collectionItems.js`) — заменяются на
   `fetch({API_URL}/api/products?collection=...)`, `ProductPage.jsx` — на
   `fetch({API_URL}/api/products/:id)`.
4. Добавить `VITE_API_URL` в `frontend/.env` (и в переменные окружения
   Vercel-проекта фронтенда).

Могу сделать это следующим шагом — скажи, если продолжать сразу с
интеграцией фронта, или сначала разверни и проверь бэкенд отдельно.
