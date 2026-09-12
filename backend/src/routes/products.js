import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/errorHandler.js';

export const productsRouter = Router();

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
    images: product.images.map((img) => img.url),
    collections: product.collections.map((pc) => pc.collection.slug),
  };
}

// GET /api/products?collection=sale — список товаров, опционально отфильтрованный
// по слагу коллекции (home / sale / archive / tshirts / new-collection / ...).
productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { collection } = req.query;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(collection ? { collections: { some: { collection: { slug: String(collection) } } } } : {}),
      },
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json(products.map(serializeProduct));
  })
);

// GET /api/products/:id — карточка товара.
productsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Некорректный id товара');

    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: productInclude,
    });
    if (!product) throw new HttpError(404, 'Товар не найден');

    res.json(serializeProduct(product));
  })
);
