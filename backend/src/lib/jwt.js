import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

// Всё, что связано с токенами админа, собрано здесь — чтобы выпуск и проверка
// токена не могли разойтись по настройкам (алгоритм, секрет, срок жизни).

const ALGORITHM = 'HS256';
const MIN_SECRET_LENGTH = 32;
const DEFAULT_EXPIRES_IN = '12h';

// Ошибка конфигурации сервера (а не «плохой токен от клиента») — отличаем её,
// чтобы не отвечать 401 там, где на самом деле нужно чинить .env.
export class JwtConfigError extends Error {}

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new JwtConfigError('JWT_SECRET не задан');
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new JwtConfigError(`JWT_SECRET слишком короткий: нужно минимум ${MIN_SECRET_LENGTH} символов`);
  }
  // Не даём запуститься с заглушкой, скопированной из .env.example.
  if (/сгенерируй|changeme|change_me|secret_here|your_secret/i.test(secret)) {
    throw new JwtConfigError('JWT_SECRET похож на заглушку из .env.example — сгенерируй настоящий');
  }
  return secret;
}

/** Бросает JwtConfigError, если секрет не годится. Вызывается при старте server.js. */
export function assertJwtConfig() {
  getSecret();
}

// «Отпечаток» текущего пароля админа внутри токена. Стоит сменить пароль —
// отпечаток меняется, и все ранее выданные токены перестают работать
// (в обычном JWT отозвать токен до истечения срока иначе нельзя).
// HMAC с секретом — чтобы по токену нельзя было судить о самом bcrypt-хеше.
export function passwordFingerprint(passwordHash) {
  return crypto.createHmac('sha256', getSecret()).update(passwordHash).digest('hex').slice(0, 16);
}

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: String(admin.id), email: admin.email, pv: passwordFingerprint(admin.passwordHash) },
    getSecret(),
    { algorithm: ALGORITHM, expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN }
  );
}

/** Возвращает payload или бросает ошибку jsonwebtoken / JwtConfigError. */
export function verifyAdminToken(token) {
  // algorithms фиксируем явно: иначе проверка принимает любой алгоритм из заголовка токена.
  return jwt.verify(token, getSecret(), { algorithms: [ALGORITHM] });
}
