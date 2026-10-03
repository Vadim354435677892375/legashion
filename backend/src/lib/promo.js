import { HttpError } from '../middleware/errorHandler.js';

/** Код без пробелов и в верхнем регистре: «summer10 » и «SUMMER10» — один и тот же промокод. */
export function normalizePromoCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

/**
 * Проверяет, можно ли сейчас применить промокод. Бросает HttpError(400) с понятным
 * текстом для покупателя. Несуществующий и выключенный код отвечают одинаково —
 * чтобы по ответу нельзя было угадывать, какие коды заведены.
 */
export function assertPromoUsable(promo, now = new Date()) {
  if (!promo || !promo.isActive) throw new HttpError(400, 'Промокод не найден');
  if (promo.expiresAt && promo.expiresAt <= now) throw new HttpError(400, 'Срок действия промокода истёк');
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    throw new HttpError(400, 'Промокод уже использован максимальное число раз');
  }
}

/** Сумма скидки в рублях (целое). Скидка никогда не превышает сумму заказа. */
export function calcPromoDiscount(promo, subtotal) {
  const raw =
    promo.discountType === 'PERCENT' ? Math.round((subtotal * promo.value) / 100) : promo.value;
  return Math.max(0, Math.min(raw, subtotal));
}
