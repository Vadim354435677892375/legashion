import bcrypt from 'bcryptjs';

// Один стоимостный фактор на всё: и для реальных хешей, и для «холостого» хеша
// в логине (см. routes/admin/auth.js) — иначе время ответа выдаёт, что email существует.
export const BCRYPT_ROUNDS = 12;

const MIN_LENGTH = 12;
const FORBIDDEN = new Set([
  'changeme123',
  'changeme1234',
  'password1234',
  'admin1234567',
  '123456789012',
  'qwertyuiop12',
]);

/** Бросает Error с понятным сообщением, если пароль слишком слабый. */
export function assertStrongPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    throw new Error(`Пароль должен быть не короче ${MIN_LENGTH} символов`);
  }
  if (FORBIDDEN.has(password.toLowerCase())) {
    throw new Error('Этот пароль слишком известный — придумай другой');
  }
  if (/^(.)\1+$/.test(password)) {
    throw new Error('Пароль не должен состоять из одного повторяющегося символа');
  }
}

export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
