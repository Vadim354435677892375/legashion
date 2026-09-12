import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { upsertProductSchema } from '../../schemas/product.js';

export const adminProductsRouter = Router();

const productInclude = {
  images: { orderBy: { position: 'asc' } },
  collections: { include: { collection: true } },
};

function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    discountPercent: product.discountPercent,
    density: product.density,
    composition: product.composition,
    isActive: product.isActive,
    images: product.images.map((img) => ({ id: img.id, url: img.url })),
    collectionSlugs: product.collections.map((pc) => pc.collection.slug),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

// В админке (в отличие от публичного API) отдаём и неактивные товары — чтобы
// их можно было найти и снова включить.
adminProductsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map(serializeProduct));
  })
);

adminProductsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) throw new HttpError(404, 'Товар не найден');
    res.json(serializeProduct(product));
  })
);

// Общая логика для create/update: связывает товар с коллекциями по slug'ам
// (создавая коллекцию на лету, если админ ввёл новый slug) и пересоздаёт список фото.
async function syncCollectionsAndImages(tx, productId, { collectionSlugs, imageUrls }) {
  const collections = await Promise.all(
    collectionSlugs.map((slug) =>
      tx.collection.upsert({
        where: { slug },
        update: {},
        create: { slug, title: slug },
      })
    )
  );

  await tx.productCollection.deleteMany({ where: { productId } });
  if (collections.length > 0) {
    await tx.productCollection.createMany({
      data: collections.map((c) => ({ productId, collectionId: c.id })),
    });
  }

  await tx.productImage.deleteMany({ where: { productId } });
  if (imageUrls.length > 0) {
    await tx.productImage.createMany({
      data: imageUrls.map((url, position) => ({ productId, url, position })),
    });
  }
}

adminProductsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = upsertProductSchema.parse(req.body);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: data.name,
          price: data.price,
          discountPercent: data.discountPercent,
          density: data.density || null,
          composition: data.composition || null,
          isActive: data.isActive,
        },
      });
      await syncCollectionsAndImages(tx, created.id, data);
      return tx.product.findUnique({ where: { id: created.id }, include: productInclude });
    });

    res.status(201).json(serializeProduct(product));
  })
);

adminProductsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = upsertProductSchema.parse(req.body);

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Товар не найден');

    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          price: data.price,
          discountPercent: data.discountPercent,
          density: data.density || null,
          composition: data.composition || null,
          isActive: data.isActive,
        },
      });
      await syncCollectionsAndImages(tx, id, data);
      return tx.product.findUnique({ where: { id }, include: productInclude });
    });

    res.json(serializeProduct(product));
  })
);

adminProductsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Товар не найден');

    // Товар мягко выключаем, если на него уже есть заказы (нельзя терять историю
    // заказов из-за onDelete: SetNull), иначе удаляем полностью.
    const hasOrders = await prisma.orderItem.findFirst({ where: { productId: id } });
    if (hasOrders) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.json({ softDeleted: true });
    }

    await prisma.product.delete({ where: { id } });
    res.json({ deleted: true });
  })
);
