// Vercel-обёртка: серверлесс-функция ожидает (req, res)-хендлер, объявленный
// прямо в точке входа. Простое `export default app` (где app — реэкспорт из
// другого файла) у некоторых версий Vercel Node.js-рантайма не проходит
// проверку "default export must be a function" — оборачиваем явной функцией.
import { app } from '../src/app.js';

export default function handler(req, res) {
  return app(req, res);
}
