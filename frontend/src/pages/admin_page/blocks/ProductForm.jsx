import { useRef, useState } from 'react';
import { adminPost, adminPut, adminUploadImage } from '../../../utils/adminApi';

// Форма создания/редактирования товара. Тело запроса должно совпадать с
// upsertProductSchema (backend/src/schemas/product.js): price и discountPercent —
// именно числа, collectionSlugs — слаги существующих (или новых) коллекций,
// imageUrls — массив URL, порядок в массиве = порядок в галерее, первое фото обложка.

const EMPTY = {
  name: '',
  price: '',
  discountPercent: '0',
  density: '',
  composition: '',
  isActive: true,
  collectionSlugs: [],
  imageUrls: [],
};

function toFormState(product) {
  if (!product) return EMPTY;
  return {
    name: product.name,
    price: String(product.price),
    discountPercent: String(product.discountPercent),
    density: product.density ?? '',
    composition: product.composition ?? '',
    isActive: product.isActive,
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
      density: form.density.trim() || null,
      composition: form.composition.trim() || null,
      isActive: form.isActive,
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

        <div className="admin-form-row">
          <label>
            Плотность
            <input
              type="text"
              value={form.density}
              onChange={(e) => update({ density: e.target.value })}
              placeholder="320 г/м²"
            />
          </label>

          <label>
            Состав
            <input
              type="text"
              value={form.composition}
              onChange={(e) => update({ composition: e.target.value })}
              placeholder="80% хлопок, 20% полиэстер"
            />
          </label>
        </div>

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