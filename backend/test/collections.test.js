import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { addAdmin, loadApp, login } from './helpers.js';

let ctx;
let token;

before(async () => {
  ctx = await loadApp({ cacheKey: 'collections' });
});
after(() => ctx.close());

beforeEach(async () => {
  const db = ctx.prisma._db;
  db.admins = [];
  db.collections = [
    { id: 201, slug: 'sale', title: 'SALE', marquee: null, bannerVideoUrl: null, bannerPosterUrl: null },
    { id: 202, slug: 'archive', title: 'ARCHIVE', marquee: null, bannerVideoUrl: null, bannerPosterUrl: null },
  ];
  const { admin, password } = addAdmin(ctx.prisma);
  token = (await (await login(ctx.base, { email: admin.email, password })).json()).token;
});

function call(path, method, body, auth = true) {
  return fetch(`${ctx.base}/api/admin/collections${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const create = (body) => call('', 'POST', body);

describe('создание коллекции', () => {
  it('корректные данные → 201, коллекция появляется в списке', async () => {
    const res = await create({ slug: 'winter-2026', title: 'WINTER 2026', marquee: null });
    assert.equal(res.status, 201);

    const list = await (await call('', 'GET')).json();
    const created = list.find((c) => c.slug === 'winter-2026');
    assert.equal(created.title, 'WINTER 2026');
    assert.equal(created.hasVideoBanner, true);
  });

  it('slug с заглавными, пробелом, подчёркиванием, кириллицей или пустой → 400 с понятной причиной', async () => {
    for (const slug of ['New Collection', 'Winter', 'winter_2026', 'новая', 'a/b', '']) {
      const res = await create({ slug, title: 'X', marquee: null });
      assert.equal(res.status, 400, JSON.stringify(slug));
      const { details } = await res.json();
      assert.equal(details[0].path, 'slug');
      assert.match(details[0].message, /slug/);
      assert.doesNotMatch(details[0].message, /String must contain/); // без англ. текста zod по умолчанию
    }
    assert.equal(ctx.prisma._db.collections.length, 2);
  });

  it('пустой заголовок → 400 «Укажите заголовок»', async () => {
    const res = await create({ slug: 'winter-2026', title: '   ', marquee: null });
    assert.equal(res.status, 400);
    assert.deepEqual((await res.json()).details, [{ path: 'title', message: 'Укажите заголовок' }]);
  });

  it('повтор существующего slug → 409, а не 500', async () => {
    const res = await create({ slug: 'sale', title: 'ещё одна', marquee: null });
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /уже существует/);
    assert.equal(ctx.prisma._db.collections.length, 2);
  });

  it('без токена → 401', async () => {
    const res = await call('', 'POST', { slug: 'x', title: 'x' }, false);
    assert.equal(res.status, 401);
  });
});

describe('изменение коллекции', () => {
  it('правка заголовка проходит', async () => {
    const res = await call('/201', 'PUT', { slug: 'sale', title: 'РАСПРОДАЖА', marquee: 'скидки' });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).title, 'РАСПРОДАЖА');
  });

  it('переименование в уже занятый slug → 409', async () => {
    const res = await call('/201', 'PUT', { slug: 'archive', title: 'SALE', marquee: null });
    assert.equal(res.status, 409);
    assert.equal(ctx.prisma._db.collections[0].slug, 'sale');
  });

  it('несуществующая коллекция → 404', async () => {
    const res = await call('/999', 'PUT', { slug: 'x', title: 'x', marquee: null });
    assert.equal(res.status, 404);
  });
});
