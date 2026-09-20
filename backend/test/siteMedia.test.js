import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { addAdmin, loadApp, login } from './helpers.js';

// Настоящий s3.js ходит на S3_ENDPOINT — подставляем туда крошечный локальный сервер,
// который запоминает запросы. Так видно, какие файлы бэкенд реально удаляет из бакета.
const BUCKET = 'legashion-media';
let s3Server;
let s3Requests = [];

let ctx;
let token;
let PUBLIC;

before(async () => {
  s3Server = await new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // SDK дописывает ?x-id=DeleteObject — для сравнения оставляем только путь
      s3Requests.push(`${req.method} ${req.url.split('?')[0]}`);
      res.statusCode = 204;
      res.end();
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
  const endpoint = `http://127.0.0.1:${s3Server.address().port}`;
  PUBLIC = `https://cdn.example.test/${BUCKET}`;

  // s3.js читает окружение при первой загрузке — задаём его до loadApp.
  ctx = await loadApp({
    cacheKey: 'siteMedia',
    env: {
      S3_ENDPOINT: endpoint,
      S3_REGION: 'ru-central1',
      S3_BUCKET: BUCKET,
      S3_ACCESS_KEY_ID: 'test-key',
      S3_SECRET_ACCESS_KEY: 'test-secret-test-secret',
      S3_PUBLIC_URL: PUBLIC,
      S3_FORCE_PATH_STYLE: 'true',
    },
  });
});

after(async () => {
  await ctx.close();
  await new Promise((r) => s3Server.close(r));
});

beforeEach(async () => {
  s3Requests = [];
  const db = ctx.prisma._db;
  db.admins = [];
  db.siteMedia = [];
  db.tracks = [];
  db.collections = [
    { id: 101, slug: 'new-collection', title: 'NEW COLLECTION', marquee: null, bannerVideoUrl: null, bannerPosterUrl: null },
    { id: 102, slug: 'sale', title: 'SALE', marquee: null, bannerVideoUrl: null, bannerPosterUrl: null },
  ];
  const { admin, password } = addAdmin(ctx.prisma);
  const res = await login(ctx.base, { email: admin.email, password });
  token = (await res.json()).token;
});

const file = (name) => `${PUBLIC}/media/${name}`;

function api(path, { method = 'GET', body, auth = true } = {}) {
  return fetch(`${ctx.base}${path}`, {
    method,
    headers: {
      ...(auth ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const deleted = () => s3Requests.filter((r) => r.startsWith('DELETE'));

describe('доступ', () => {
  it('публичный GET /api/site-media открыт и по умолчанию пуст', async () => {
    const res = await api('/api/site-media', { auth: false });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { media: {}, playerTracks: [] });
  });

  it('все админские эндпоинты требуют токен', async () => {
    const calls = [
      ['/api/admin/site-media', 'GET'],
      ['/api/admin/site-media/slots/intro.background', 'PUT'],
      ['/api/admin/site-media/slots/intro.background', 'DELETE'],
      ['/api/admin/site-media/tracks', 'POST'],
      ['/api/admin/site-media/tracks/order', 'PUT'],
      ['/api/admin/site-media/collections/101/banner', 'PUT'],
      ['/api/admin/upload/presign', 'POST'],
    ];
    for (const [path, method] of calls) {
      const res = await api(path, { method, body: method === 'GET' ? undefined : {}, auth: false });
      assert.equal(res.status, 401, `${method} ${path}`);
    }
  });
});

describe('слоты-картинки', () => {
  it('админка видит все слоты, пока ни один не заменён', async () => {
    const { slots } = await (await api('/api/admin/site-media')).json();
    assert.ok(slots.length >= 15);
    assert.ok(slots.every((s) => s.url === null && s.key && s.label && s.group));
    assert.ok(slots.some((s) => s.key === 'intro.background'));
  });

  it('замена слота сразу видна на публичном API', async () => {
    const url = file('a.jpg');
    const res = await api('/api/admin/site-media/slots/models.look-1', { method: 'PUT', body: { url } });
    assert.equal(res.status, 200);

    const pub = await (await api('/api/site-media', { auth: false })).json();
    assert.deepEqual(pub.media, { 'models.look-1': url });

    const { slots } = await (await api('/api/admin/site-media')).json();
    assert.equal(slots.find((s) => s.key === 'models.look-1').url, url);
  });

  it('неизвестный слот → 404', async () => {
    const res = await api('/api/admin/site-media/slots/nope.nothing', {
      method: 'PUT',
      body: { url: file('a.jpg') },
    });
    assert.equal(res.status, 404);
  });

  it('ссылки не из нашего бакета и опасные адреса отклоняются', async () => {
    const bad = [
      'https://evil.example/x.png',
      'javascript:alert(1)',
      `${PUBLIC}/media/a.jpg)`,
      `${PUBLIC}/media/a".jpg`,
      `${PUBLIC}/media/a b.jpg`,
      `${PUBLIC}evil/x.jpg`, // тот же префикс без разделителя — другой хост/путь
      '',
    ];
    for (const url of bad) {
      const res = await api('/api/admin/site-media/slots/models.look-1', { method: 'PUT', body: { url } });
      assert.equal(res.status, 400, url);
    }
    assert.deepEqual(ctx.prisma._db.siteMedia, []);
  });

  it('при повторной замене старый файл удаляется из бакета', async () => {
    await api('/api/admin/site-media/slots/tshirts.hero', { method: 'PUT', body: { url: file('old.jpg') } });
    assert.deepEqual(deleted(), []);

    await api('/api/admin/site-media/slots/tshirts.hero', { method: 'PUT', body: { url: file('new.jpg') } });
    assert.deepEqual(deleted(), [`DELETE /${BUCKET}/media/old.jpg`]);
  });

  it('повторная загрузка той же ссылки ничего не удаляет', async () => {
    const url = file('same.jpg');
    await api('/api/admin/site-media/slots/tshirts.hero', { method: 'PUT', body: { url } });
    await api('/api/admin/site-media/slots/tshirts.hero', { method: 'PUT', body: { url } });
    assert.deepEqual(deleted(), []);
  });

  it('сброс возвращает картинку по умолчанию и чистит бакет', async () => {
    await api('/api/admin/site-media/slots/intro.background', { method: 'PUT', body: { url: file('bg.gif') } });
    const res = await api('/api/admin/site-media/slots/intro.background', { method: 'DELETE' });
    assert.equal(res.status, 200);

    assert.deepEqual((await (await api('/api/site-media', { auth: false })).json()).media, {});
    assert.deepEqual(deleted(), [`DELETE /${BUCKET}/media/bg.gif`]);
  });

  it('сброс незаменённого слота — не ошибка', async () => {
    const res = await api('/api/admin/site-media/slots/intro.background', { method: 'DELETE' });
    assert.equal(res.status, 200);
    assert.deepEqual(deleted(), []);
  });

  it('файлы вне папки media/ (например, фото товаров) не удаляются', async () => {
    const productPhoto = `${PUBLIC}/products/123-shirt.jpg`;
    await api('/api/admin/site-media/slots/models.look-2', { method: 'PUT', body: { url: productPhoto } });
    await api('/api/admin/site-media/slots/models.look-2', { method: 'DELETE' });
    assert.deepEqual(deleted(), []);
  });

  it('слоты, убранные из реестра, наружу не отдаются', async () => {
    ctx.prisma._db.siteMedia.push({ key: 'old.removed', url: file('x.jpg'), updatedAt: new Date() });
    const pub = await (await api('/api/site-media', { auth: false })).json();
    assert.deepEqual(pub.media, {});
  });
});

describe('плейлист плеера', () => {
  const create = (title, name, poster) =>
    api('/api/admin/site-media/tracks', {
      method: 'POST',
      body: { title, videoUrl: file(name), posterUrl: poster ? file(poster) : null },
    });

  it('ролики добавляются в конец и отдаются публично по порядку', async () => {
    assert.equal((await create('Тизер', 'a.mp4', 'a.jpg')).status, 201);
    assert.equal((await create('Backstage', 'b.mp4')).status, 201);

    const { playerTracks } = await (await api('/api/site-media', { auth: false })).json();
    assert.deepEqual(
      playerTracks.map((t) => [t.title, t.videoUrl, t.posterUrl]),
      [
        ['Тизер', file('a.mp4'), file('a.jpg')],
        ['Backstage', file('b.mp4'), null],
      ]
    );
  });

  it('название обязательно, ссылка на видео — только из бакета', async () => {
    const noTitle = await api('/api/admin/site-media/tracks', {
      method: 'POST',
      body: { title: '  ', videoUrl: file('a.mp4') },
    });
    assert.equal(noTitle.status, 400);

    const foreign = await api('/api/admin/site-media/tracks', {
      method: 'POST',
      body: { title: 'x', videoUrl: 'https://evil.example/a.mp4' },
    });
    assert.equal(foreign.status, 400);
    assert.equal(ctx.prisma._db.tracks.length, 0);
  });

  it('порядок меняется, а неполный или устаревший список отклоняется', async () => {
    const a = await (await create('A', 'a.mp4')).json();
    const b = await (await create('B', 'b.mp4')).json();
    const c = await (await create('C', 'c.mp4')).json();

    const ok = await api('/api/admin/site-media/tracks/order', { method: 'PUT', body: { ids: [c.id, a.id, b.id] } });
    assert.equal(ok.status, 200);
    const { playerTracks } = await (await api('/api/site-media', { auth: false })).json();
    assert.deepEqual(playerTracks.map((t) => t.title), ['C', 'A', 'B']);

    for (const ids of [[a.id, b.id], [a.id, a.id, b.id], [a.id, b.id, c.id, 999]]) {
      const bad = await api('/api/admin/site-media/tracks/order', { method: 'PUT', body: { ids } });
      assert.equal(bad.status, 400, JSON.stringify(ids));
    }
  });

  it('при замене видео и постера старые файлы удаляются', async () => {
    const t = await (await create('T', 'old.mp4', 'old.jpg')).json();
    const res = await api(`/api/admin/site-media/tracks/${t.id}`, {
      method: 'PUT',
      body: { title: 'T2', videoUrl: file('new.mp4'), posterUrl: file('old.jpg') },
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).title, 'T2');
    // постер остался прежним — удаляется только заменённое видео
    assert.deepEqual(deleted(), [`DELETE /${BUCKET}/media/old.mp4`]);
  });

  it('удаление ролика чистит и видео, и постер', async () => {
    const t = await (await create('T', 'v.mp4', 'p.jpg')).json();
    const res = await api(`/api/admin/site-media/tracks/${t.id}`, { method: 'DELETE' });
    assert.equal(res.status, 200);
    assert.equal(ctx.prisma._db.tracks.length, 0);
    assert.deepEqual(deleted().sort(), [`DELETE /${BUCKET}/media/p.jpg`, `DELETE /${BUCKET}/media/v.mp4`]);
  });

  it('несуществующий ролик → 404', async () => {
    const put = await api('/api/admin/site-media/tracks/999', {
      method: 'PUT',
      body: { title: 'x', videoUrl: file('a.mp4') },
    });
    const del = await api('/api/admin/site-media/tracks/999', { method: 'DELETE' });
    assert.equal(put.status, 404);
    assert.equal(del.status, 404);
  });
});

describe('промо-видео коллекции', () => {
  const setBanner = (id, body) =>
    api(`/api/admin/site-media/collections/${id}/banner`, { method: 'PUT', body });

  it('в списке админки только коллекции с видео-баннером (без sale/archive/…)', async () => {
    const { collections } = await (await api('/api/admin/site-media')).json();
    assert.deepEqual(collections.map((c) => c.slug), ['new-collection']);
  });

  it('видео и постер сохраняются, замена удаляет старые файлы, null очищает', async () => {
    const first = await setBanner(101, { videoUrl: file('v1.mp4'), posterUrl: file('p1.jpg') });
    assert.equal(first.status, 200);
    assert.equal(ctx.prisma._db.collections[0].bannerVideoUrl, file('v1.mp4'));

    await setBanner(101, { videoUrl: file('v2.mp4'), posterUrl: file('p1.jpg') });
    assert.deepEqual(deleted(), [`DELETE /${BUCKET}/media/v1.mp4`]);

    s3Requests = [];
    await setBanner(101, { videoUrl: null, posterUrl: null });
    assert.equal(ctx.prisma._db.collections[0].bannerVideoUrl, null);
    assert.deepEqual(deleted().sort(), [`DELETE /${BUCKET}/media/p1.jpg`, `DELETE /${BUCKET}/media/v2.mp4`]);
  });

  it('чужая ссылка и несуществующая коллекция отклоняются', async () => {
    const foreign = await setBanner(101, { videoUrl: 'https://evil.example/v.mp4', posterUrl: null });
    assert.equal(foreign.status, 400);
    const missing = await setBanner(999, { videoUrl: null, posterUrl: null });
    assert.equal(missing.status, 404);
  });
});

describe('подписанная загрузка (presign)', () => {
  const presign = (body) => api('/api/admin/upload/presign', { method: 'POST', body });

  it('для mp4 возвращает подписанную ссылку, публичный адрес и нужные заголовки', async () => {
    const res = await presign({ contentType: 'video/mp4', size: 50 * 1024 * 1024 });
    assert.equal(res.status, 201);
    const { uploadUrl, publicUrl, headers } = await res.json();

    assert.match(publicUrl, new RegExp(`^${PUBLIC}/media/\\d+-[0-9a-f-]{36}\\.mp4$`));
    assert.deepEqual(headers, { 'Content-Type': 'video/mp4', 'x-amz-acl': 'public-read' });

    const url = new URL(uploadUrl);
    assert.ok(url.pathname.endsWith(publicUrl.slice(PUBLIC.length)));
    assert.equal(url.searchParams.get('X-Amz-Algorithm'), 'AWS4-HMAC-SHA256');
    assert.ok(url.searchParams.get('X-Amz-Signature'));
    // в подпись входят размер файла и ACL — подменить их по этой ссылке нельзя
    assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'content-length;host;x-amz-acl');
    // никаких CRC32-параметров, на которых спотыкаются S3-совместимые хранилища
    assert.equal([...url.searchParams.keys()].some((k) => k.toLowerCase().includes('checksum')), false);
  });

  it('расширение берётся из типа файла, а не из имени, каждая ссылка уникальна', async () => {
    const a = await (await presign({ contentType: 'image/png', size: 1000 })).json();
    const b = await (await presign({ contentType: 'image/png', size: 1000 })).json();
    assert.match(a.publicUrl, /\.png$/);
    assert.notEqual(a.publicUrl, b.publicUrl);
  });

  it('SVG, exe и прочее не принимаются', async () => {
    for (const contentType of ['image/svg+xml', 'application/x-msdownload', 'text/html', 'video/quicktime', '']) {
      const res = await presign({ contentType, size: 1000 });
      assert.equal(res.status, 400, contentType);
    }
  });

  it('лимиты размера: картинка до 20 МБ, видео до 200 МБ', async () => {
    const MB = 1024 * 1024;
    assert.equal((await presign({ contentType: 'image/jpeg', size: 20 * MB })).status, 201);
    assert.equal((await presign({ contentType: 'image/jpeg', size: 20 * MB + 1 })).status, 400);
    assert.equal((await presign({ contentType: 'video/webm', size: 200 * MB })).status, 201);
    assert.equal((await presign({ contentType: 'video/webm', size: 200 * MB + 1 })).status, 400);
  });

  it('некорректные данные → 400', async () => {
    for (const body of [{}, { contentType: 'image/png' }, { contentType: 'image/png', size: 0 }, { contentType: 'image/png', size: -5 }, { contentType: 'image/png', size: '10' }]) {
      const res = await presign(body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
  });
});
