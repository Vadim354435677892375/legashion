import { useCallback, useEffect, useState } from 'react';
import { adminGet, adminPatch } from '../../../utils/adminApi';
import { formatPrice } from '../../../utils/pricing';

// Вкладка «Заказы»: список гостевых заказов + смена статуса
// (PATCH /api/admin/orders/:id/status). Статусы — из enum OrderStatus в schema.prisma.

const STATUSES = [
  { id: 'NEW', label: 'Новый' },
  { id: 'PROCESSING', label: 'В обработке' },
  { id: 'SHIPPED', label: 'Отправлен' },
  { id: 'COMPLETED', label: 'Завершён' },
  { id: 'CANCELLED', label: 'Отменён' },
];

const DELIVERY = { CDEK: 'СДЭК', RUSSIAN_POST: 'Почта России' };
const PAYMENT = { CARD: 'Картой', SBP: 'СБП' };

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      setOrders(await adminGet(`/api/admin/orders${query}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(order, status) {
    try {
      const updated = await adminPatch(`/api/admin/orders/${order.id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Заказы {!loading && <span className="admin-count">{orders.length}</span>}</h2>

        <label className="admin-filter">
          Статус
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">все</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-muted">Загрузка...</p>}
      {!loading && orders.length === 0 && <p className="admin-muted">Заказов пока нет.</p>}

      <div className="admin-orders">
        {orders.map((order) => (
          <article key={order.id} className="admin-order">
            <header>
              <strong>№ {order.orderNumber}</strong>
              <span className="admin-muted">{formatDate(order.createdAt)}</span>
              <select value={order.status} onChange={(e) => changeStatus(order, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </header>

            <p>
              {order.fullName} · +{order.phoneCallingCode} {order.phone}
            </p>
            <p className="admin-muted">
              {order.countryCode}, {order.city}, {order.address}
            </p>
            <p className="admin-muted">
              {DELIVERY[order.deliveryType] ?? order.deliveryType} ·{' '}
              {PAYMENT[order.paymentMethod] ?? order.paymentMethod}
              {order.promoCode ? ` · промокод ${order.promoCode}` : ''}
            </p>
            {order.comment && <p className="admin-muted">Комментарий: {order.comment}</p>}

            <ul className="admin-order-items">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.name}
                  {item.size ? `, ${item.size}` : ''} × {item.qty} — {formatPrice(item.price)}
                </li>
              ))}
            </ul>

            <p className="admin-order-total">Итого: {formatPrice(order.totalPrice)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}