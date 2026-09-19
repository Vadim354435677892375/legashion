import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { addAdmin, JWT_SECRET, loadApp, login } from './helpers.js';
import { assertJwtConfig, JwtConfigError } from '../src/lib/jwt.js';
import { assertStrongPassword } from '../src/lib/password.js';

afterEach(() => {
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('проверка JWT_SECRET', () => {
  for (const [name, value] of [
    ['не задан', undefined],
    ['слишком короткий', 'short-secret'],
    ['заглушка из .env.example', 'сгенерируй_длинную_случайную_строку_и_ещё_немного'],
    ['заглушка на латинице', 'changeme-changeme-changeme-changeme-changeme'],
  ]) {
    it(`отклоняет секрет: ${name}`, () => {
      if (value === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = value;
      assert.throws(() => assertJwtConfig(), JwtConfigError);
    });
  }

  it('принимает нормальный секрет', () => {
    process.env.JWT_SECRET = JWT_SECRET;
    assert.doesNotThrow(() => assertJwtConfig());
  });

  it('при сломанном секрете логин отвечает 500 и не выдаёт токен', async () => {
    const ctx = await loadApp({ cacheKey: 'badsecret' });
    const { admin, password } = addAdmin(ctx.prisma);
    process.env.JWT_SECRET = 'short';
    const res = await login(ctx.base, { email: admin.email, password });
    assert.equal(res.status, 500);
    assert.equal((await res.json()).token, undefined);
    await ctx.close();
  });
});

describe('проверка пароля', () => {
  it('отклоняет короткие, известные и однотипные пароли', () => {
    for (const bad of ['', 'short', 'changeme123', 'ChangeMe123', 'aaaaaaaaaaaaaaaa', undefined]) {
      assert.throws(() => assertStrongPassword(bad), undefined, String(bad));
    }
  });
  it('принимает нормальный пароль', () => {
    assert.doesNotThrow(() => assertStrongPassword('correct-horse-battery'));
  });
});

describe('CORS и заголовки', () => {
  it('в проде без CORS_ORIGIN cross-origin запросы не получают разрешения', async () => {
    const ctx = await loadApp({ env: { NODE_ENV: 'production', CORS_ORIGIN: '' }, cacheKey: 'prod-empty' });
    const res = await fetch(`${ctx.base}/api/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    await ctx.close();
  });

  it('в проде разрешён только origin из списка', async () => {
    const ctx = await loadApp({
      env: { NODE_ENV: 'production', CORS_ORIGIN: 'https://legashion.vercel.app' },
      cacheKey: 'prod-list',
    });
    const ok = await fetch(`${ctx.base}/api/health`, { headers: { Origin: 'https://legashion.vercel.app' } });
    const bad = await fetch(`${ctx.base}/api/health`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://legashion.vercel.app');
    assert.equal(bad.headers.get('access-control-allow-origin'), null);
    await ctx.close();
  });

  it('в деве при пустом CORS_ORIGIN разрешено всё (чтобы не мешать разработке)', async () => {
    const ctx = await loadApp({ env: { NODE_ENV: 'development', CORS_ORIGIN: '' }, cacheKey: 'dev-empty' });
    const res = await fetch(`${ctx.base}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    await ctx.close();
  });

  it('helmet: есть защитные заголовки, нет X-Powered-By', async () => {
    const ctx = await loadApp({ env: { NODE_ENV: 'development', CORS_ORIGIN: '' }, cacheKey: 'helmet' });
    const res = await fetch(`${ctx.base}/api/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.ok(res.headers.get('strict-transport-security'));
    await ctx.close();
  });
});
