import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const collectionsRouter = Router();

// GET /api/collections — для блока «Категории» на главной (CollectionBlock.jsx)
// и для заголовка/бегущей строки страницы коллекции (CollectionPage.jsx).
collectionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const collections = await prisma.collection.findMany({ orderBy: { id: 'asc' } });
    res.json(collections);
  })
);

// GET /api/collections/:slug — метаданные одной коллекции (заголовок, marquee)
// для страницы конкретной коллекции (CollectionPage.jsx, /collection/:slug).
collectionsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const collection = await prisma.collection.findUnique({ where: { slug: req.params.slug } });
    if (!collection) return res.status(404).json({ error: 'Коллекция не найдена' });
    res.json(collection);
  })
);
