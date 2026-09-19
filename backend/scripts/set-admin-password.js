// Создаёт админа или меняет пароль существующему.
//
//   npm run admin:set-password                      — спросит email и пароль (пароль не отображается)
//   npm run admin:set-password -- me@example.com    — email из аргумента, пароль спросит
//
// Для автоматизации можно передать SET_ADMIN_EMAIL / SET_ADMIN_PASSWORD через переменные
// окружения, но в обычном терминале так делать не стоит: пароль попадёт в историю команд.
//
// После смены пароля все ранее выданные токены этого админа перестают работать.
import 'dotenv/config';
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { prisma } from '../src/lib/prisma.js';
import { assertStrongPassword, hashPassword } from '../src/lib/password.js';

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    let muted = false;
    const output = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) process.stdout.write(chunk, encoding);
        callback();
      },
    });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: Boolean(process.stdin.isTTY) });
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
    muted = hidden; // включаем «скрытый ввод» после того, как вопрос уже выведен
  });
}

async function main() {
  const email = (process.argv[2] || process.env.SET_ADMIN_EMAIL || (await ask('Email админа: '))).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Некорректный email');
  }

  let password = process.env.SET_ADMIN_PASSWORD;
  if (!password) {
    password = await ask('Новый пароль (от 12 символов): ', { hidden: true });
    const repeat = await ask('Повтори пароль: ', { hidden: true });
    if (password !== repeat) throw new Error('Пароли не совпадают');
  }
  assertStrongPassword(password);

  const passwordHash = await hashPassword(password);
  const existing = await prisma.admin.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (existing) {
    await prisma.admin.update({ where: { id: existing.id }, data: { passwordHash } });
    console.log(`Пароль для ${existing.email} обновлён. Все старые сессии завершены.`);
  } else {
    await prisma.admin.create({ data: { email, passwordHash } });
    console.log(`Админ ${email} создан.`);
  }
}

main()
  .catch((e) => {
    console.error(`Ошибка: ${e.message || e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
