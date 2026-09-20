import { useCallback, useEffect, useRef, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../../utils/adminApi';
import { MEDIA_LIMITS_HINT, useMediaActions } from './mediaActions';
import { CollectionBannerCard, SlotCard } from './mediaParts';

// Вкладка «Коллекции». slug — это то, что стоит в URL страницы магазина
// (/collection/:slug) и в фильтре GET /api/products?collection=slug.
// Слаги home/sale/archive/tshirts захардкожены в страницах фронта —
// переименовывать их нельзя, иначе соответствующая страница опустеет.
//
// В форме коллекции (создание/редактирование) — и всё её медиа: промо-видео на странице
// коллекции и картинки, привязанные к ней в backend/src/lib/mediaSlots.js (карточка на главной,
// баннер Archive, фото «Футболок»). Файлы сохраняются сразу при загрузке, независимо от
// кнопки «Сохранить» (она — только для slug/заголовка/бегущей строки).

const RESERVED = ['home', 'sale', 'archive', 'tshirts'];
const EMPTY = { slug: '', title: '', marquee: '' };

// slug попадает в адрес страницы, поэтому допустимы только латиница, цифры и дефис (сервер
// проверяет то же самое). Приводим ввод к такому виду на лету: заглавные → строчные,
// пробелы и подчёркивания → дефис, всё остальное (в том числе кириллица) убираем.
// Так нельзя случайно ввести недопустимый slug — а нативной проверки pattern мало: браузеры
// молча отключают её, если pattern не компилируется.
function normalizeSlug(value) {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// Текст ошибки с причиной: сервер отдаёт общий заголовок («Ошибка валидации») и список
// конкретных проблем в details — без них непонятно, что править.
function describeError(err) {
  const details = Array.isArray(err.details) ? err.details : [];
  if (details.length === 0) return err.message;
  const reasons = details.map((d) => (d.message.startsWith(d.path) ? d.message : `${d.path}: ${d.message}`));
  return `${err.message}: ${reasons.join('; ')}`;
}

export default function CollectionsTab() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsError, setSlotsError] = useState(null);
  const formRef = useRef(null);

  const fetchCollections = useCallback(async () => {
    setCollections(await adminGet('/api/admin/collections'));
  }, []);

  // Слоты грузим отдельно и с собственной ошибкой: если что-то не так с медиа-частью
  // (например, не применена миграция), список коллекций от этого ломаться не должен.
  const loadSlots = useCallback(async () => {
    try {
      setSlots((await adminGet('/api/admin/site-media')).slots);
      setSlotsError(null);
    } catch (err) {
      setSlotsError(err.message);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchCollections();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCollections]);

  useEffect(() => {
    load();
    loadSlots();
  }, [load, loadSlots]);

  // После загрузки/сброса файла перечитываем тихо, без «Загрузка...» и без сброса формы.
  const reloadMedia = useCallback(async () => {
    await Promise.all([fetchCollections(), loadSlots()]);
  }, [fetchCollections, loadSlots]);
  const media = useMediaActions(reloadMedia);

  const editing = collections.find((c) => c.id === editingId) ?? null;
  const editingSlots = editing ? slots.filter((slot) => slot.collection === editing.slug) : [];

  // Форма стоит под таблицей — при выборе коллекции подъезжаем к ней.
  useEffect(() => {
    if (editingId) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editingId]);

  function startEdit(collection) {
    setNotice(null);
    media.setError(null);
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
    setNotice(null);
    media.setError(null);
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
      if (editingId) {
        await adminPut(`/api/admin/collections/${editingId}`, payload);
        resetForm();
        await load();
      } else {
        // Новая коллекция: остаёмся в форме, уже в режиме редактирования, — чтобы сразу
        // можно было загрузить видео и фото (им нужен id созданной коллекции).
        const created = await adminPost('/api/admin/collections', payload);
        await Promise.all([load(), loadSlots()]);
        setEditingId(created.id);
        setNotice('Коллекция создана. Ниже можно загрузить её видео и картинки.');
      }
    } catch (err) {
      setError(describeError(err));
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
      if (collection.id === editingId) resetForm();
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

      <form className="admin-form admin-form-inline" onSubmit={handleSubmit} ref={formRef}>
        <h3>{editingId ? 'Редактирование коллекции' : 'Новая коллекция'}</h3>

        <div className="admin-form-row">
          <label>
            slug
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: normalizeSlug(e.target.value) })}
              placeholder="winter-2026"
              pattern="[a-z0-9\-]+"
              title="Латиница, цифры и дефис"
              required
            />
            <span className="admin-muted">
              Адрес страницы: /collection/{form.slug || '…'}. Только латиница, цифры и дефис —
              заглавные буквы, пробелы и русские буквы убираются.
            </span>
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

        {notice && <p className="admin-notice">{notice}</p>}

        <fieldset className="admin-fieldset">
          <legend>Медиа коллекции</legend>

          {!editingId && (
            <p className="admin-muted">
              Сначала сохраните коллекцию — после этого здесь появится загрузка промо-видео и
              картинок этой коллекции.
            </p>
          )}

          {editingId && !editing && <p className="admin-muted">Загрузка...</p>}

          {editing && (
            <>
              {media.error && <p className="admin-error">{media.error}</p>}
              {slotsError && <p className="admin-error">{slotsError}</p>}

              {!editing.hasVideoBanner && editingSlots.length === 0 && !slotsError && (
                <p className="admin-muted">
                  У этой коллекции нет заменяемых картинок и видео: её страница не содержит
                  промо-видео, а товары меняются на вкладке «Товары».
                </p>
              )}

              <div className="admin-media-grid admin-media-grid-wide">
                {editing.hasVideoBanner && <CollectionBannerCard collection={editing} media={media} />}
                {editingSlots.map((slot) => (
                  <SlotCard
                    key={slot.key}
                    slot={slot}
                    label={slot.collectionLabel ?? slot.label}
                    media={media}
                  />
                ))}
              </div>

              <p className="admin-muted">
                {MEDIA_LIMITS_HINT} Файлы сохраняются сразу, кнопка «Сохранить» для них не нужна.
              </p>
            </>
          )}
        </fieldset>

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