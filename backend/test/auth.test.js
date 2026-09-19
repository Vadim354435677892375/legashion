import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addAdmin, JWT_SECRET, loadApp, login } from './helpers.js';
import { passwordFingerprint } from '../src/lib/jwt.js';
import { BCRYPT_ROUNDS } from '../src/lib/password.js';

let ctx;
let admin;
let password;

before(async () => {
  ctx = await loadApp({ cacheKey: 'auth' });
});
after(() => ctx.close());

beforeEach(() => {
  ctx.prisma._db.admins = [];
  ctx.prisma._db.attempts = [];
  ({ admin, password } = addAdmin(ctx.prisma));
});

const me = (base, token) =>
  fetch(`${base}/api/admin/auth/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

describe('логин', () => {
  it('верные данные → токен, и с ним работает /me', async () => {
    const res = await login(ctx.base, { email: admin.email, password });
    assert.equal(res.status, 200);
    const { token } = await res.json();
    assert.ok(token);
    assert.equal((await me(ctx.base, token)).status, 200);
  });

  it('email нечувствителен к регистру', async () => {
    const res = await login(ctx.base, { email: 'ADMIN@Legashion.RU', password });
    assert.equal(res.status, 200);
  });

  it('неверный пароль и неизвестный email дают одинаковый ответ', async () => {
    const a = await login(ctx.base, { email: admin.email, password: 'wrong-password-1' });
    const b = await login(ctx.base, { email: 'nobody@example.com', password: 'wrong-password-1' });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.deepEqual(await a.json(), await b.json());
  });

  it('для несуществующего email bcrypt.compare гоняется по хешу той же стоимости, что и настоящий', async () => {
    const original = bcrypt.compare;
    const seenHashes = [];
    bcrypt.compare = (pw, hash, ...rest) => {
      seenHashes.push(hash);
      return original(pw, hash, ...rest);
    };
    try {
      await login(ctx.base, { email: 'nobody@example.com', password: 'whatever-123456' });
    } finally {
      bcrypt.compare = original;
    }
    assert.equal(seenHashes.length, 1);
    // Именно стоимость хеша определяет время ответа: холостой хеш должен «весить» как реальный.
    assert.equal(bcrypt.getRounds(seenHashes[0]), BCRYPT_ROUNDS);
  });

  it('слишком длинный пароль отклоняется валидацией, а не уходит в bcrypt', async () => {
    const res = await login(ctx.base, { email: admin.email, password: 'x'.repeat(5000) });
    assert.equal(res.status, 400);
  });
});

describe('ограничение попыток', () => {
  it('после 5 неудач с одного IP вход блокируется, даже с верным паролем', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await login(ctx.base, { email: admin.email, password: `bad-password-${i}`, ip: '198.51.100.7' });
      assert.equal(r.status, 401);
    }
    const blocked = await login(ctx.base, { email: admin.email, password, ip: '198.51.100.7' });
    assert.equal(blocked.status, 429);
    assert.ok(blocked.headers.get('retry-after'));
  });

  it('блокировка одного IP не мешает другому IP', async () => {
    for (let i = 0; i < 5; i++) {
      await login(ctx.base, { email: admin.email, password: `bad-${i}-password`, ip: '198.51.100.7' });
    }
    const other = await login(ctx.base, { email: admin.email, password, ip: '198.51.100.99' });
    assert.equal(other.status, 200);
  });

  it('распределённый подбор с разных IP упирается в лимит по email', async () => {
    for (let i = 0; i < 10; i++) {
      const r = await login(ctx.base, { email: admin.email, password: `bad-${i}-password`, ip: `192.0.2.${i + 1}` });
      assert.equal(r.status, 401);
    }
    const blocked = await login(ctx.base, { email: admin.email, password, ip: '192.0.2.200' });
    assert.equal(blocked.status, 429);
  });

  it('старые попытки (вне окна 15 минут) не считаются', async () => {
    const old = new Date(Date.now() - 20 * 60 * 1000);
    for (let i = 0; i < 20; i++) {
      ctx.prisma._db.attempts.push({ id: 1000 + i, email: admin.email, ip: '198.51.100.7', createdAt: old });
    }
    const res = await login(ctx.base, { email: admin.email, password, ip: '198.51.100.7' });
    assert.equal(res.status, 200);
  });

  it('успешный вход сбрасывает счётчик по email', async () => {
    for (let i = 0; i < 4; i++) {
      await login(ctx.base, { email: admin.email, password: `bad-${i}-password`, ip: `192.0.2.${i + 1}` });
    }
    await login(ctx.base, { email: admin.email, password, ip: '192.0.2.50' });
    assert.equal(ctx.prisma._db.attempts.filter((a) => a.email === admin.email).length, 0);
  });

  it('старше 24 часов записи удаляются', async () => {
    ctx.prisma._db.attempts.push({
      id: 999, email: 'x@example.com', ip: '9.9.9.9', createdAt: new Date(Date.now() - 25 * 3600 * 1000),
    });
    await login(ctx.base, { email: admin.email, password: 'bad-password-xx', ip: '198.51.100.7' });
    assert.ok(!ctx.prisma._db.attempts.some((a) => a.id === 999));
  });
});

describe('проверка токена', () => {
  const claims = () => ({ sub: String(admin.id), email: admin.email, pv: passwordFingerprint(admin.passwordHash) });

  it('без токена → 401', async () => {
    assert.equal((await me(ctx.base)).status, 401);
  });

  it('мусорный токен → 401', async () => {
    assert.equal((await me(ctx.base, 'not.a.jwt')).status, 401);
  });

  it('токен, подписанный чужим секретом → 401', async () => {
    const t = jwt.sign(claims(), 'other-secret-other-secret-other-secret', { algorithm: 'HS256' });
    assert.equal((await me(ctx.base, t)).status, 401);
  });

  it('токен с alg=none → 401', async () => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const t = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ ...claims(), exp: Math.floor(Date.now() / 1000) + 3600 })}.`;
    assert.equal((await me(ctx.base, t)).status, 401);
  });

  it('токен с верным секретом, но другим алгоритмом (HS512) → 401', async () => {
    const t = jwt.sign(claims(), JWT_SECRET, { algorithm: 'HS512', expiresIn: '1h' });
    assert.equal((await me(ctx.base, t)).status, 401);
  });

  it('просроченный токен → 401', async () => {
    const t = jwt.sign(claims(), JWT_SECRET, { algorithm: 'HS256', expiresIn: -10 });
    assert.equal((await me(ctx.base, t)).status, 401);
  });

  it('токен старого формата (без pv) → 401', async () => {
    const t = jwt.sign({ sub: admin.id, email: admin.email }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
    assert.equal((await me(ctx.base, t)).status, 401);
  });

  it('после смены пароля старый токен перестаёт работать', async () => {
    const { token } = await (await login(ctx.base, { email: admin.email, password })).json();
    assert.equal((await me(ctx.base, token)).status, 200);
    admin.passwordHash = bcrypt.hashSync('brand-new-password-1', 4);
    assert.equal((await me(ctx.base, token)).status, 401);
  });

  it('после удаления админа токен перестаёт работать', async () => {
    const { token } = await (await login(ctx.base, { email: admin.email, password })).json();
    ctx.prisma._db.admins = [];
    assert.equal((await me(ctx.base, token)).status, 401);
  });

  it('срок жизни токена по умолчанию — 12 часов', async () => {
    const { token } = await (await login(ctx.base, { email: admin.email, password })).json();
    const { iat, exp } = jwt.decode(token);
    assert.equal(exp - iat, 12 * 3600);
  });

  it('все админ-роуты закрыты без токена', async () => {
    for (const path of ['products', 'collections', 'orders']) {
      const res = await fetch(`${ctx.base}/api/admin/${path}`);
      assert.equal(res.status, 401, `/api/admin/${path}`);
    }
    const up = await fetch(`${ctx.base}/api/admin/upload`, { method: 'POST' });
    assert.equal(up.status, 401);
  });
});
