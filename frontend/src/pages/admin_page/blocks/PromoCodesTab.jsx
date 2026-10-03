import { useCallback, useEffect, useState } from 'react';
import { adminDelete, adminGet, adminPost, adminPut } from '../../../utils/adminApi';

// Вкладка «Промокоды»: список + форма создания/редактирования.
// Тело запроса должно совпадать с upsertPromoSchema (backend/src/schemas/promo.js):
// code приводится к верхнему регистру на сервере, value — целое число
// (проценты 1–100 или фиксированная скидка в рублях), expiresAt/maxUses можно
// оставить пустыми — тогда промокод бессрочный и без лимита использований.

const EMPTY = {
  code: '',
  discountType: 'PERCENT',
  value: '',
  isActive: true,
  expiresAt: '',
  maxUses: '',
};

function toFormState(promo) {
  if (!promo) return EMPTY;
  return {
    code: promo.code,
    discountType: promo.discountType,
    value: String(promo.value),
    isActive: promo.isActive,
    expiresAt: promo.expiresAt ? promo.expiresAt.slice(0, 10) : '',
    maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
  };
}

function describeError(err) {
  const details = Array.isArray(err.details) ? err.details : [];
  if (details.length === 0) return err.message;
  const reasons = details.map((d) => (d.message.startsWith(d.path) ? d.message : `${d.path}: ${d.message}`));
  return `${err.message}: ${reasons.join('; ')}`;
}

function formatDiscount(promo) {
  return promo.discountType === 'PERCENT' ? `−${promo.value}%` : `−${promo.value} ₽`;
}

export default function PromoCodesTab() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPromoCodes(await adminGet('/api/admin/promo-codes'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(promo) {
    setError(null);
    setEditingId(promo.id);
    setForm(toFormState(promo));
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY);
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      code: form.code.trim(),
      discountType: form.discountType,
      value: Number(form.value),
      isActive: form.isActive,
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
    };

    try {
      if (editingId) await adminPut(`/api/admin/promo-codes/${editingId}`, payload);
      else await adminPost('/api/admin/promo-codes', payload);
      resetForm();
      await load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(promo) {
    const confirmed = window.confirm(`Удалить промокод «${promo.code}»?`);
    if (!confirmed) return;

    try {
      await adminDelete(`/api/admin/promo-codes/${promo.id}`);
      if (promo.id === editingId) resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Промокоды</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-muted">Загрузка...</p>}

      {!loading && promoCodes.length === 0 && (
        <p className="admin-muted">Промокодов пока нет — создайте первый ниже.</p>
      )}

      {!loading && promoCodes.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Код</th>
              <th>Скидка</th>
              <th>Действует до</th>
              <th>Использований</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((promo) => (
              <tr key={promo.id}>
                <td>
                  <code>{promo.code}</code>
                </td>
                <td>{formatDiscount(promo)}</td>
                <td className="admin-muted">
                  {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('ru-RU') : 'бессрочно'}
                </td>
                <td className="admin-muted">
                  {promo.usedCount}
                  {promo.maxUses != null ? ` / ${promo.maxUses}` : ''}
                </td>
                <td>
                  {promo.isActive ? (
                    <span className="admin-badge admin-badge-sale">активен</span>
                  ) : (
                    <span className="admin-badge">выключен</span>
                  )}
                </td>
                <td className="admin-table-actions">
                  <button type="button" onClick={() => startEdit(promo)}>
                    Изменить
                  </button>
                  <button type="button" className="admin-danger" onClick={() => handleDelete(promo)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form className="admin-form admin-form-inline" onSubmit={handleSubmit}>
        <h3>{editingId ? 'Редактирование промокода' : 'Новый промокод'}</h3>

        <div className="admin-form-row">
          <label>
            Код
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              pattern="[A-Za-z0-9_-]{3,32}"
              title="3–32 символа: латиница, цифры, дефис и подчёркивание"
              required
            />
          </label>

          <label>
            Тип скидки
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value })}
            >
              <option value="PERCENT">Процент от суммы</option>
              <option value="FIXED">Фиксированная сумма, ₽</option>
            </select>
          </label>

          <label>
            {form.discountType === 'PERCENT' ? 'Скидка, %' : 'Скидка, ₽'}
            <input
              type="number"
              min="1"
              max={form.discountType === 'PERCENT' ? 100 : undefined}
              step="1"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </label>
        </div>

        <div className="admin-form-row">
          <label>
            Действует до
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
            <span className="admin-muted">Пусто — без ограничения по сроку.</span>
          </label>

          <label>
            Лимит использований
            <input
              type="number"
              min="1"
              step="1"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="без ограничения"
            />
          </label>
        </div>

        <label className="admin-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Промокод активен
        </label>

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
