import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@legashion.ru';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash },
  });
  console.log(`Админ готов: ${adminEmail} / ${adminPassword} (смени пароль после первого входа!)`);

  console.log('Готово.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
