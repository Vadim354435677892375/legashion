import { useRef, useState } from 'react';
import { adminPost, adminPut, adminUploadImage } from '../../../utils/adminApi';
import { AVAILABLE_SIZES, DEFAULT_SIZES } from '../../../utils/sizes';

// Форма создания/редактирования товара. Тело запроса должно совпадать с
// upsertProductSchema (backend/src/schemas/product.js): price и discountPercent —
// именно числа, collectionSlugs — слаги существующих (или новых) коллекций,
// imageUrls — массив URL, порядок в массиве = порядок в галерее, первое фото обложка.

const EMPTY = {
  name: '',
  price: '',
  discountPercent: '0',
  description: '',
  isActive: true,
  weightGrams: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  sizes: [...DEFAULT_SIZES],
  // остаток: по размерам { S: '5' } (строки — значения инпутов) и общее количество для товара без размеров
  stock: {},
  quantity: '0',
  collectionSlugs: [],
  imageUrls: [],
};

function toFormState(product) {
  if (!product) return EMPTY;
  return {
    name: product.name,
    price: String(product.price),
    discountPercent: String(product.discountPercent),
    description: product.description ?? '',
    isActive: product.isActive,
    // у товаров, созданных до появления этих полей, значения null → пустое поле
    weightGrams: product.weightGrams == null ? '' : String(product.weightGrams),
    lengthCm: product.lengthCm == null ? '' : String(product.lengthCm),
    widthCm: product.widthCm == null ? '' : String(product.widthCm),
    heightCm: product.heightCm == null ? '' : String(product.heightCm),
    sizes: [...(product.sizes ?? [])],
    stock: Object.fromEntries(
      Object.entries(product.stock ?? {}).map(([size, qty]) => [size, String(qty)])
    ),
    quantity: String(product.quantity ?? 0),
    collectionSlugs: [...product.collectionSlugs],
    imageUrls: product.images.map((img) => img.url),
  };
}

export default function ProductForm({ product, collections, onCancel, onSaved }) {
  const [form, setForm] = useState(() => toFormState(product));
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef(null);

  function update(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleCollection(slug) {
    update({
      collectionSlugs: form.collectionSlugs.includes(slug)
        ? form.collectionSlugs.filter((s) => s !== slug)
        : [...form.collectionSlugs, slug],
    });
  }

  function toggleSize(size) {
    update({
      sizes: form.sizes.includes(size)
        ? form.sizes.filter((s) => s !== size)
        : [...form.sizes, size],
    });
  }

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      // Грузим по одному: POST /api/admin/upload принимает одно поле image.
      const urls = [];
      for (const file of files) {
        urls.push(await adminUploadImage(file));
      }
      update({ imageUrls: [...form.imageUrls, ...urls] });
    } catch (err) {
      setError(
        `${err.message}. Если Yandex Object Storage ещё не настроен (S3_* в backend/.env), добавь фото по прямой ссылке ниже.`
      );
    } finally {
      setUploading(false);
      // сбрасываем input, иначе повторный выбор того же файла не вызовет onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    update({ imageUrls: [...form.imageUrls, url] });
    setManualUrl('');
  }

  function removeImage(index) {
    update({ imageUrls: form.imageUrls.filter((_, i) => i !== index) });
  }

  function moveImage(index, direction) {
    const next = [...form.imageUrls];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    update({ imageUrls: next });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setDetails(null);

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      discountPercent: Number(form.discountPercent) || 0,
      description: form.description.trim() || null,
      isActive: form.isActive,
      // пустая строка → NaN → бэкенд ответит понятной ошибкой «укажите число»
      weightGrams: form.weightGrams === '' ? null : Number(form.weightGrams),
      lengthCm: form.lengthCm === '' ? null : Number(form.lengthCm),
      widthCm: form.widthCm === '' ? null : Number(form.widthCm),
      heightCm: form.heightCm === '' ? null : Number(form.heightCm),
      sizes: form.sizes,
      // пустое поле = 0; лишние размеры (сняли галочку) бэкенд отбросит сам
      stock: Object.fromEntries(
        form.sizes.map((size) => [size, Math.max(0, Math.floor(Number(form.stock[size])) || 0)])
      ),
      quantity: Math.max(0, Math.floor(Number(form.quantity)) || 0),
      collectionSlugs: form.collectionSlugs,
      imageUrls: form.imageUrls,
    };

    try {
      if (product) await adminPut(`/api/admin/products/${product.id}`, payload);
      else await adminPost('/api/admin/products', payload);
      await onSaved();
    } catch (err) {
      setError(err.message);
      // zod возвращает подробности по каждому полю — показываем их, иначе
      // «Ошибка валидации» без объяснений бесполезна.
      setDetails(err.details ?? null);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>{product ? `Товар #${product.id}` : 'Новый товар'}</h2>
        <button type="button" onClick={onCancel}>
          ← К списку
        </button>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <label>
          Название
          <input
            type="text"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder='Худи LEGASHION Black'
            required
          />
        </label>

        <div className="admin-form-row">
          <label>
            Цена, ₽
            <input
              type="number"
              min="1"
              step="1"
              value={form.price}
              onChange={(e) => update({ price: e.target.value })}
              required
            />
          </label>

          <label>
            Скидка, %
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.discountPercent}
              onChange={(e) => update({ discountPercent: e.target.value })}
            />
          </label>
        </div>

        <label>
          Описание
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </label>

        <fieldset className="admin-fieldset">
          <legend>Вес и габариты для доставки</legend>
          <p className="admin-muted">
            Только для расчёта доставки и оформления отправления в СДЭК — на сайте покупатели
            этого не видят. Указывайте вес и размеры товара <strong>в упаковке</strong>, за одну
            штуку. Пока все четыре значения не заполнены, товар не показывается на сайте.
          </p>
          <div className="admin-form-row">
            <label>
              Вес, г
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={form.weightGrams}
                onChange={(e) => update({ weightGrams: e.target.value })}
                placeholder="500"
                required
              />
            </label>
            <label>
              Длина, см
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={form.lengthCm}
                onChange={(e) => update({ lengthCm: e.target.value })}
                required
              />
            </label>
            <label>
              Ширина, см
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={form.widthCm}
                onChange={(e) => update({ widthCm: e.target.value })}
                required
              />
            </label>
            <label>
              Высота, см
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                value={form.heightCm}
                onChange={(e) => update({ heightCm: e.target.value })}
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Коллекции</legend>
          <p className="admin-muted">
            Товар без коллекций не попадёт ни на одну страницу магазина. Главная — это{' '}
            <code>home</code>.
          </p>
          <div className="admin-checks">
            {collections.map((collection) => (
              <label key={collection.id} className="admin-check">
                <input
                  type="checkbox"
                  checked={form.collectionSlugs.includes(collection.slug)}
                  onChange={() => toggleCollection(collection.slug)}
                />
                {collection.title} <span className="admin-muted">({collection.slug})</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Размеры</legend>
          <p className="admin-muted">
            Если не отметить ни один размер, товар будет заказываться без выбора размера
            (подходит для аксессуаров).
          </p>
          <div className="admin-checks">
            {AVAILABLE_SIZES.map((size) => (
              <label key={size} className="admin-check">
                <input
                  type="checkbox"
                  checked={form.sizes.includes(size)}
                  onChange={() => toggleSize(size)}
                />
                {size}
              </label>
            ))}
          </div>

          {form.sizes.length > 0 ? (
            <>
              <p className="admin-muted">
                Сколько штук в наличии по каждому размеру. 0 — размера нет в наличии, покупатель
                его не сможет заказать. Остаток уменьшается при заказе и возвращается при отмене.
              </p>
              <div className="admin-form-row">
                {AVAILABLE_SIZES.filter((size) => form.sizes.includes(size)).map((size) => (
                  <label key={size}>
                    {size}, шт.
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      value={form.stock[size] ?? '0'}
                      onChange={(e) =>
                        update({ stock: { ...form.stock, [size]: e.target.value } })
                      }
                    />
                  </label>
                ))}
              </div>
            </>
          ) : (
            <label>
              Количество в наличии, шт.
              <input
                type="number"
                min="0"
                max="100000"
                step="1"
                value={form.quantity}
                onChange={(e) => update({ quantity: e.target.value })}
              />
            </label>
          )}
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Фото</legend>
          <p className="admin-muted">
            Первое фото — обложка карточки. Порядок можно менять стрелками.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            disabled={uploading}
          />
          {uploading && <p className="admin-muted">Загружаем...</p>}

          <div className="admin-url-add">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="или вставь прямую ссылку на картинку"
            />
            <button type="button" onClick={addManualUrl}>
              Добавить
            </button>
          </div>

          <ul className="admin-images">
            {form.imageUrls.map((url, index) => (
              <li key={`${url}-${index}`}>
                <img src={url} alt="" />
                <span className="admin-image-url">{url}</span>
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === form.imageUrls.length - 1}
                >
                  ↓
                </button>
                <button type="button" className="admin-danger" onClick={() => removeImage(index)}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </fieldset>

        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => update({ isActive: e.target.checked })}
          />
          Показывать в магазине
        </label>

        {error && <p className="admin-error">{error}</p>}
        {details && (
          <pre className="admin-details">{JSON.stringify(details, null, 2)}</pre>
        )}

        <div className="admin-form-actions">
          <button type="submit" className="admin-primary" disabled={pending || uploading}>
            {pending ? 'Сохраняем...' : 'Сохранить'}
          </button>
          <button type="button" onClick={onCancel}>
            Отмена
          </button>
        </div>
      </form>
    </section>
  );
}