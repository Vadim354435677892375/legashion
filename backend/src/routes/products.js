import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/errorHandler.js';
import { HAS_SHIPPING_DATA } from '../lib/shipping.js';
import { serializeStock } from '../lib/stock.js';

export const productsRouter = Router();

const productInclude = {
  images: { orderBy: { position: 'asc' } },
  collections: { include: { collection: true } },
  stock: true,
};

// Публичный ответ собирается явным списком полей (whitelist): вес и габариты товара
// (weightGrams/lengthCm/widthCm/heightCm) сюда добавлять НЕЛЬЗЯ — они только для админки и доставки.
function serializeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    discountPercent: product.discountPercent,
    description: product.description,
    sizes: product.sizes,
    // остаток для показа покупателю: stock — по размерам, quantity — для товара без размеров
    ...serializeStock(product),
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
        // товар без веса/габаритов на сайте не показываем (см. lib/shipping.js)
        ...HAS_SHIPPING_DATA,
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
      where: { id, isActive: true, ...HAS_SHIPPING_DATA },
      include: productInclude,
    });
    if (!product) throw new HttpError(404, 'Товар не найден');

    res.json(serializeProduct(product));
  })
);