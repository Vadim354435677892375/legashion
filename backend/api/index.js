// Vercel-обёртка: серверлесс-функция ожидает (req, res)-хендлер. Работает
// только когда Framework Preset проекта на Vercel = "Other" (см. Settings →
// General) — в автоопределённом режиме "Express" Vercel игнорирует и эту
// обёртку, и vercel.json целиком, поэтому переключение пресета обязательно.
import { app } from '../src/app.js';

export default function handler(req, res) {
  return app(req, res);
}