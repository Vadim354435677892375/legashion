import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { deleteMediaByUrl } from '../../lib/s3.js';
import {
  COLLECTIONS_WITHOUT_VIDEO_BANNER,
  MEDIA_SLOTS,
  SLOT_KEYS,
} from '../../lib/mediaSlots.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { bannerSchema, slotSchema, trackOrderSchema, trackSchema } from '../../schemas/media.js';

export const adminSiteMediaRouter = Router();

const trackOrderBy = [{ position: 'asc' }, { id: 'asc' }];

function assertSlot(key) {
  if (!SLOT_KEYS.has(key)) throw new HttpError(404, 'Такого места для картинки на сайте нет');
}

function parseId(raw, what) {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new HttpError(404, `${what} не найден`);
  return id;
}

// Всё для вкладки «Медиа» одним ответом: слоты с их текущим значением,
// плейлист плеера и коллекции с промо-видео.
adminSiteMediaRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows, tracks, collections] = await Promise.all([
      prisma.siteMedia.findMany(),
      prisma.playerTrack.findMany({ orderBy: trackOrderBy }),
      prisma.collection.findMany({ orderBy: { id: 'asc' } }),
    ]);
    const byKey = new Map(rows.map((row) => [row.key, row]));

    res.json({
      slots: MEDIA_SLOTS.map((slot) => ({
        ...slot,
        url: byKey.get(slot.key)?.url ?? null, // null → на сайте показывается картинка по умолчанию
        updatedAt: byKey.get(slot.key)?.updatedAt ?? null,
      })),
      tracks,
      collections: collections
        .filter((c) => !COLLECTIONS_WITHOUT_VIDEO_BANNER.includes(c.slug))
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          bannerVideoUrl: c.bannerVideoUrl,
          bannerPosterUrl: c.bannerPosterUrl,
        })),
    });
  })
);

// --- Слоты-картинки ---------------------------------------------------------

adminSiteMediaRouter.put(
  '/slots/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    assertSlot(key);
    const { url } = slotSchema.parse(req.body);

    const previous = await prisma.siteMedia.findUnique({ where: { key } });
    const row = await prisma.siteMedia.upsert({
      where: { key },
      update: { url },
      create: { key, url },
    });

    if (previous && previous.url !== url) await deleteMediaByUrl(previous.url);
    res.json({ key: row.key, url: row.url, updatedAt: row.updatedAt });
  })
);

// «Сбросить»: убираем замену — на сайте снова картинка по умолчанию.
adminSiteMediaRouter.delete(
  '/slots/:key',
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    assertSlot(key);

    const previous = await prisma.siteMedia.findUnique({ where: { key } });
    if (previous) {
      await prisma.siteMedia.delete({ where: { key } });
      await deleteMediaByUrl(previous.url);
    }
    res.json({ reset: true });
  })
);

// --- Плейлист плеера --------------------------------------------------------

// Маршрут /tracks/order объявлен раньше /tracks/:id, иначе «order» попадёт в :id.
adminSiteMediaRouter.put(
  '/tracks/order',
  asyncHandler(async (req, res) => {
    const { ids } = trackOrderSchema.parse(req.body);

    const existing = await prisma.playerTrack.findMany();
    const sameSet =
      ids.length === existing.length &&
      new Set(ids).size === ids.length &&
      existing.every((t) => ids.includes(t.id));
    if (!sameSet) throw new HttpError(400, 'Список роликов устарел — обновите страницу');

    await prisma.$transaction(
      ids.map((id, position) => prisma.playerTrack.update({ where: { id }, data: { position } }))
    );
    res.json(await prisma.playerTrack.findMany({ orderBy: trackOrderBy }));
  })
);

adminSiteMediaRouter.post(
  '/tracks',
  asyncHandler(async (req, res) => {
    const data = trackSchema.parse(req.body);
    const last = await prisma.playerTrack.findFirst({ orderBy: { position: 'desc' } });

    const track = await prisma.playerTrack.create({
      data: {
        title: data.title,
        videoUrl: data.videoUrl,
        posterUrl: data.posterUrl ?? null,
        position: last ? last.position + 1 : 0,
      },
    });
    res.status(201).json(track);
  })
);

adminSiteMediaRouter.put(
  '/tracks/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'Ролик');
    const data = trackSchema.parse(req.body);

    const previous = await prisma.playerTrack.findUnique({ where: { id } });
    if (!previous) throw new HttpError(404, 'Ролик не найден');

    const track = await prisma.playerTrack.update({
      where: { id },
      data: { title: data.title, videoUrl: data.videoUrl, posterUrl: data.posterUrl ?? null },
    });

    if (previous.videoUrl !== track.videoUrl) await deleteMediaByUrl(previous.videoUrl);
    if (previous.posterUrl !== track.posterUrl) await deleteMediaByUrl(previous.posterUrl);
    res.json(track);
  })
);

adminSiteMediaRouter.delete(
  '/tracks/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'Ролик');
    const previous = await prisma.playerTrack.findUnique({ where: { id } });
    if (!previous) throw new HttpError(404, 'Ролик не найден');

    await prisma.playerTrack.delete({ where: { id } });
    await deleteMediaByUrl(previous.videoUrl);
    await deleteMediaByUrl(previous.posterUrl);
    res.json({ deleted: true });
  })
);

// --- Промо-видео на странице коллекции --------------------------------------

// Отдельный эндпоинт, а не поля в PUT /api/admin/collections/:id: тот требует
// slug/title и не должен затирать видео, когда админ просто правит заголовок.
adminSiteMediaRouter.put(
  '/collections/:id/banner',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'Коллекция');
    const { videoUrl, posterUrl } = bannerSchema.parse(req.body);

    const previous = await prisma.collection.findUnique({ where: { id } });
    if (!previous) throw new HttpError(404, 'Коллекция не найдена');

    const collection = await prisma.collection.update({
      where: { id },
      data: { bannerVideoUrl: videoUrl, bannerPosterUrl: posterUrl },
    });

    if (previous.bannerVideoUrl !== collection.bannerVideoUrl) {
      await deleteMediaByUrl(previous.bannerVideoUrl);
    }
    if (previous.bannerPosterUrl !== collection.bannerPosterUrl) {
      await deleteMediaByUrl(previous.bannerPosterUrl);
    }
    res.json({
      id: collection.id,
      slug: collection.slug,
      title: collection.title,
      bannerVideoUrl: collection.bannerVideoUrl,
      bannerPosterUrl: collection.bannerPosterUrl,
    });
  })
);
