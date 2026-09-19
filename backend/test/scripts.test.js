import { describe, it, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../src/lib/password.js';

// Общий «журнал» обращений к БД: и seed.js (свой PrismaClient), и set-admin-password.js
// (общий lib/prisma.js) пишут сюда.
const calls = [];
let admins = [];
let onDisconnect;

function makeClient() {
  const rec = (name, result) => async (arg) => {
    calls.push(name);
    return typeof result === 'function' ? result(arg) : result;
  };
  return {
    collection: { upsert: rec('collection.upsert', (a) => ({ id: 1, ...a.create })) },
    product: { create: rec('product.create', {}) },
    admin: {
      findFirst: rec('admin.findFirst', (a) =>
        admins.find((x) => x.email.toLowerCase() === a.where.email.equals.toLowerCase()) ?? null),
      create: rec('admin.create', (a) => { admins.push({ id: admins.length + 1, ...a.data }); return a.data; }),
      update: rec('admin.update', (a) => {
        const row = admins.find((x) => x.id === a.where.id);
        Object.assign(row, a.data);
        return row;
      }),
    },
    $disconnect: async () => onDisconnect?.(),
  };
}

const client = makeClient();
mock.module('@prisma/client', { namedExports: { PrismaClient: class { constructor() { return client; } } } });
mock.module(new URL('../src/lib/prisma.js', import.meta.url).href, { namedExports: { prisma: client } });

const ENV_KEYS = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'SET_ADMIN_EMAIL', 'SET_ADMIN_PASSWORD'];
let logs;
let exitCalls;
let methodMocks = [];
let n = 0;

beforeEach(() => {
  calls.length = 0;
  admins = [];
  logs = [];
  exitCalls = [];
  for (const k of ENV_KEYS) delete process.env[k];
  methodMocks = [
    mock.method(console, 'log', (...a) => logs.push(a.join(' '))),
    mock.method(console, 'error', (...a) => logs.push(a.join(' '))),
    mock.method(process, 'exit', (code) => exitCalls.push(code)),
  ];
});
afterEach(() => {
  // restoreAll() не годится: он снимает и мок модулей (prisma), а он нужен всем тестам файла.
  for (const m of methodMocks) m.mock.restore();
  process.exitCode = undefined;
});

async function runScript(path) {
  const done = new Promise((resolve) => { onDisconnect = resolve; });
  await import(`${path}?run${n++}`);
  await done;
}

describe('prisma/seed.js', () => {
  it('без пароля падает ДО любых записей в БД и не подставляет пароль по умолчанию', async () => {
    process.env.SEED_ADMIN_EMAIL = 'boss@example.com';
    await runScript('../prisma/seed.js');
    assert.deepEqual(exitCalls, [1]);
    assert.deepEqual(calls, [], 'в БД ничего не должно писаться');
  });

  it('без email тоже падает до записей', async () => {
    process.env.SEED_ADMIN_PASSWORD = 'correct-horse-battery';
    await runScript('../prisma/seed.js');
    assert.deepEqual(exitCalls, [1]);
    assert.deepEqual(calls, []);
  });

  it('старый пароль по умолчанию changeme123 отвергается', async () => {
    process.env.SEED_ADMIN_EMAIL = 'admin@legashion.ru';
    process.env.SEED_ADMIN_PASSWORD = 'changeme123';
    await runScript('../prisma/seed.js');
    assert.deepEqual(exitCalls, [1]);
    assert.deepEqual(calls, []);
  });

  it('с нормальными данными создаёт админа с bcrypt-хешем и НЕ печатает пароль', async () => {
    process.env.SEED_ADMIN_EMAIL = 'Boss@Example.com';
    process.env.SEED_ADMIN_PASSWORD = 'correct-horse-battery';
    await runScript('../prisma/seed.js');

    assert.deepEqual(exitCalls, []);
    assert.equal(admins.length, 1);
    assert.equal(admins[0].email, 'boss@example.com'); // email нормализован
    assert.notEqual(admins[0].passwordHash, 'correct-horse-battery');
    assert.ok(await bcrypt.compare('correct-horse-battery', admins[0].passwordHash));
    assert.equal(bcrypt.getRounds(admins[0].passwordHash), BCRYPT_ROUNDS);
    assert.ok(!logs.join('\n').includes('correct-horse-battery'), 'пароль не должен попадать в вывод');
  });

  it('если админ уже есть — пароль не перезаписывается', async () => {
    admins.push({ id: 1, email: 'boss@example.com', passwordHash: 'OLD_HASH' });
    process.env.SEED_ADMIN_EMAIL = 'boss@example.com';
    process.env.SEED_ADMIN_PASSWORD = 'correct-horse-battery';
    await runScript('../prisma/seed.js');
    assert.equal(admins[0].passwordHash, 'OLD_HASH');
    assert.ok(!calls.includes('admin.create'));
  });
});

describe('scripts/set-admin-password.js', () => {
  it('меняет пароль существующему админу и хеширует его', async () => {
    admins.push({ id: 7, email: 'Admin@Legashion.ru', passwordHash: bcrypt.hashSync('changeme123', 4) });
    process.env.SET_ADMIN_EMAIL = 'admin@legashion.ru'; // другой регистр — тот же админ
    process.env.SET_ADMIN_PASSWORD = 'new-strong-password-1';
    await runScript('../scripts/set-admin-password.js');

    assert.equal(admins.length, 1, 'дубликат админа создаваться не должен');
    assert.ok(await bcrypt.compare('new-strong-password-1', admins[0].passwordHash));
    assert.ok(!(await bcrypt.compare('changeme123', admins[0].passwordHash)), 'старый пароль больше не подходит');
    assert.ok(!logs.join('\n').includes('new-strong-password-1'));
    assert.equal(process.exitCode, undefined);
  });

  it('создаёт админа, если такого ещё нет', async () => {
    process.env.SET_ADMIN_EMAIL = 'new@example.com';
    process.env.SET_ADMIN_PASSWORD = 'new-strong-password-1';
    await runScript('../scripts/set-admin-password.js');
    assert.equal(admins.length, 1);
    assert.equal(admins[0].email, 'new@example.com');
  });

  it('слабый пароль отвергается, БД не меняется', async () => {
    admins.push({ id: 7, email: 'admin@legashion.ru', passwordHash: 'OLD_HASH' });
    process.env.SET_ADMIN_EMAIL = 'admin@legashion.ru';
    process.env.SET_ADMIN_PASSWORD = 'changeme123';
    await runScript('../scripts/set-admin-password.js');
    assert.equal(admins[0].passwordHash, 'OLD_HASH');
    assert.equal(process.exitCode, 1);
  });
});
