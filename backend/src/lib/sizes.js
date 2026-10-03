// Размеры, которые админ может отметить у товара. Порядок массива = порядок показа
// на карточке товара. Фронт держит такой же список в frontend/src/utils/sizes.js.
export const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Размеры по умолчанию для нового товара — как было до появления выбора размеров.
export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

/** Убирает дубли и приводит размеры к каноническому порядку (S, M, L, ...). */
export function normalizeSizes(sizes) {
  return AVAILABLE_SIZES.filter((s) => sizes.includes(s));
}
