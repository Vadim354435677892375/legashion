import { useCallback, useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../../utils/adminApi';

// Вкладка «Коллекции». slug — это то, что стоит в URL страницы магазина
// (/collection/:slug) и в фильтре GET /api/products?collection=slug.
// Слаги home/sale/archive/tshirts захардкожены в страницах фронта —
// переименовывать их нельзя, иначе соответствующая страница опустеет.

const RESERVED = ['home', 'sale', 'archive', 'tshirts'];
const EMPTY = { slug: '', title: '', marquee: '' };

export default function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCollections(await adminGet('/api/admin/collections'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(collection) {
    setEditingId(collection.id);
    setForm({
      slug: collection.slug,
      title: collection.title,
      marquee: collection.marquee ?? '',
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      marquee: form.marquee.trim() || null,
    };

    try {
      if (editingId) await adminPut(`/api/admin/collections/${editingId}`, payload);
      else await adminPost('/api/admin/collections', payload);
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(collection) {
    if (RESERVED.includes(collection.slug)) {
      setError(
        `Коллекцию «${collection.slug}» удалять нельзя — на неё завязана отдельная страница магазина.`
      );
      return;
    }

    const confirmed = window.confirm(
      `Удалить коллекцию «${collection.title}»? Товары останутся, но потеряют привязку к ней.`
    );
    if (!confirmed) return;

    try {
      await adminDelete(`/api/admin/collections/${collection.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Коллекции</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-muted">Загрузка...</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>slug</th>
            <th>Заголовок</th>
            <th>Бегущая строка</th>
            <th>Товаров</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {collections.map((collection) => (
            <tr key={collection.id}>
              <td>
                <code>{collection.slug}</code>
              </td>
              <td>{collection.title}</td>
              <td className="admin-muted">{collection.marquee || '—'}</td>
              <td>{collection._count?.products ?? 0}</td>
              <td className="admin-table-actions">
                <button type="button" onClick={() => startEdit(collection)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="admin-danger"
                  onClick={() => handleDelete(collection)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="admin-form admin-form-inline" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Редактирование коллекции' : 'Новая коллекция'}</h3>

        <div className="admin-form-row">
          <label>
            slug
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="winter-2026"
              pattern="[a-z0-9-]+"
              title="Латиница, цифры и дефис"
              required
            />
          </label>

          <label>
            Заголовок
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="WINTER 2026"
              required
            />
          </label>

          <label>
            Бегущая строка
            <input
              type="text"
              value={form.marquee}
              onChange={(e) => setForm({ ...form, marquee: e.target.value })}
              placeholder="необязательно"
            />
          </label>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-primary" disabled={pending}>
            {pending ? 'Сохраняем...' : 'Сохранить'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </section>
  );
}