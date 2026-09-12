import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const adminCollectionsRouter = Router();

const collectionSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'slug — латиница, цифры и дефис, напр. "new-collection"'),
  title: z.string().trim().min(1),
  marquee: z.string().trim().optional().nullable(),
});

adminCollectionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const collections = await prisma.collection.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { id: 'asc' },
    });
    res.json(collections);
  })
);

adminCollectionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = collectionSchema.parse(req.body);
    const collection = await prisma.collection.create({ data });
    res.status(201).json(collection);
  })
);

adminCollectionsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const data = collectionSchema.parse(req.body);

    const exists = await prisma.collection.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Коллекция не найдена');

    const collection = await prisma.collection.update({ where: { id }, data });
    res.json(collection);
  })
);

adminCollectionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const exists = await prisma.collection.findUnique({ where: { id } });
    if (!exists) throw new HttpError(404, 'Коллекция не найдена');

    await prisma.collection.delete({ where: { id } });
    res.json({ deleted: true });
  })
);
