import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { SLOT_KEYS } from '../lib/mediaSlots.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const siteMediaRouter = Router();

// GET /api/site-media — всё, что админ подменил на сайте, одним запросом:
//   media        — { [ключ слота]: url } только для заменённых слотов
//   playerTracks — плейлист видеоплеера на главной
// Промо-видео коллекций приходят не отсюда, а с GET /api/collections/:slug.
siteMediaRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows, tracks] = await Promise.all([
      prisma.siteMedia.findMany(),
      prisma.playerTrack.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] }),
    ]);

    // Слоты, которых уже нет в реестре (убрали из кода), наружу не отдаём.
    const media = Object.fromEntries(
      rows.filter((row) => SLOT_KEYS.has(row.key)).map((row) => [row.key, row.url])
    );

    res.json({
      media,
      playerTracks: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        videoUrl: t.videoUrl,
        posterUrl: t.posterUrl,
      })),
    });
  })
);
