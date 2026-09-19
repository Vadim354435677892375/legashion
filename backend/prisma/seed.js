import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { assertStrongPassword, hashPassword } from '../src/lib/password.js';

const prisma = new PrismaClient();

// Учётные данные админа обязательны и без значений по умолчанию: пароль «по умолчанию»
// в открытом репозитории — это, по сути, публичный пароль от админки.
function readAdminCredentials() {
  const email = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!email) {
    throw new Error('Задай SEED_ADMIN_EMAIL (email админа)');
  }
  assertStrongPassword(password); // бросит понятную ошибку, если пароль слабый или не задан
  return { email, password };
}

// Переносим то, что сейчас захардкожено в homeProducts.js / saleItems.js /
// tshirtItems.js / archiveItems.js / collectionItems.js на фронте, чтобы после
// переключения фронта на API магазин не остался пустым.
const COLLECTIONS = [
  { slug: 'home', title: 'Товары', marquee: null },
  { slug: 'sale', title: 'SALE', marquee: null },
  { slug: 'archive', title: 'ARCHIVE', marquee: null },
  { slug: 'tshirts', title: 'ФУТБОЛКИ', marquee: null },
  { slug: 'new-collection', title: 'NEW COLLECTION', marquee: 'NEW COLLECTION' },
];

// collectionSlugs — на каких страницах товар должен появиться (можно на нескольких сразу).
const PRODUCTS = [
  ...Array.from({ length: 6 }, () => ({
    name: 'T-shirt "Eminem"',
    price: 1800,
    discountPercent: 0,
    collectionSlugs: ['home'],
  })),
  ...Array.from({ length: 4 }, () => ({
    name: 'T-shirt "Eminem"',
    price: 1800,
    discountPercent: 20,
    collectionSlugs: ['sale'],
  })),
  ...Array.from({ length: 4 }, () => ({
    name: 'T-shirt "Eminem"',
    price: 1800,
    discountPercent: 0,
    collectionSlugs: ['archive'],
  })),
  ...Array.from({ length: 4 }, () => ({
    name: 'T-shirt "Eminem"',
    price: 1800,
    discountPercent: 0,
    collectionSlugs: ['tshirts'],
  })),
  ...Array.from({ length: 4 }, () => ({
    name: 'T-shirt "Eminem"',
    price: 1800,
    discountPercent: 0,
    collectionSlugs: ['new-collection'],
  })),
];

async function main() {
  // Проверяем креды ДО любых записей в БД — чтобы не получить полузасеянную базу.
  const { email: adminEmail, password: adminPassword } = readAdminCredentials();

  console.log('Создаю коллекции...');
  const collectionBySlug = {};
  for (const c of COLLECTIONS) {
    collectionBySlug[c.slug] = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  console.log('Создаю товары...');
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        discountPercent: p.discountPercent,
        collections: {
          create: p.collectionSlugs.map((slug) => ({ collectionId: collectionBySlug[slug].id })),
        },
      },
    });
  }

  const existing = await prisma.admin.findFirst({
    where: { email: { equals: adminEmail, mode: 'insensitive' } },
  });
  if (existing) {
    // Сид намеренно не перезаписывает пароль существующего админа.
    // Сменить пароль: npm run admin:set-password
    console.log(`Админ ${existing.email} уже существует — пароль не менялся.`);
  } else {
    await prisma.admin.create({
      data: { email: adminEmail, passwordHash: await hashPassword(adminPassword) },
    });
    console.log(`Админ создан: ${adminEmail}`);
  }

  console.log('Готово.');
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
