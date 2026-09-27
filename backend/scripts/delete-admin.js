// Удаляет админа по email.
//
//   npm run admin:delete                      — спросит email, попросит подтверждение
//   npm run admin:delete -- me@example.com    — email из аргумента
//
// Не даёт удалить единственного оставшегося админа (иначе никто не сможет
// войти в /admin и завести нового через этот же скрипт) — для такого случая
// нужно явно передать --force.
import 'dotenv/config';
import readline from 'node:readline';
import { prisma } from '../src/lib/prisma.js';

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const email = (args.find((a) => !a.startsWith('--')) || (await ask('Email админа для удаления: ')))
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Некорректный email');
  }

  const admin = await prisma.admin.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (!admin) {
    throw new Error(`Админ с email ${email} не найден`);
  }

  const totalAdmins = await prisma.admin.count();
  if (totalAdmins <= 1 && !force) {
    throw new Error(
      `${admin.email} — единственный админ в базе. Сначала создайте нового (npm run admin:set-password), ` +
        'либо, если действительно хотите остаться без единого админа, повторите команду с --force.'
    );
  }

  const confirm = await ask(`Удалить админа ${admin.email}? Это необратимо. Введите "да" для подтверждения: `);
  if (confirm.trim().toLowerCase() !== 'да') {
    console.log('Отменено.');
    return;
  }

  // AdminLoginCode не связан внешним ключом с каскадным удалением (см. schema.prisma),
  // поэтому висящие коды подтверждения для этого админа чистим отдельно.
  await prisma.adminLoginCode.deleteMany({ where: { adminId: admin.id } });
  await prisma.admin.delete({ where: { id: admin.id } });

  console.log(`Админ ${admin.email} удалён. Все его токены и незавершённые коды входа больше не действуют.`);
}

main()
  .catch((e) => {
    console.error(`Ошибка: ${e.message || e}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());