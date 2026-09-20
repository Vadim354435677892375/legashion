import { useCallback, useEffect, useState } from 'react';
import './AdminPage.css';
import ProductsTab from './blocks/ProductsTab';
import CollectionsTab from './blocks/CollectionsTab';
import OrdersTab from './blocks/OrdersTab';
import MediaTab from './blocks/MediaTab';
import {
  adminLogin,
  adminLogout,
  adminMe,
  getToken,
  setUnauthorizedHandler,
} from '../../utils/adminApi';

// Админка магазина — /admin. Отдельная страница вне общего оформления сайта:
// это рабочий инструмент, а не витрина, поэтому обычный светлый интерфейс,
// без Koganejidainogemu и фоновых гифок.
//
// Личных кабинетов покупателей в проекте нет, этот логин — только для
// администратора (таблица Admin, заводится через prisma/seed.js).

const TABS = [
  { id: 'products', label: 'Товары' },
  { id: 'collections', label: 'Коллекции' },
  { id: 'media', label: 'Медиа' },
  { id: 'orders', label: 'Заказы' },
];

function LoginScreen({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const data = await adminLogin(email.trim(), password);
      onSuccess(data.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <h1>LEGASHION — админка</h1>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="admin-error">{error}</p>}

        <button type="submit" disabled={pending}>
          {pending ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  // 'checking' — проверяем сохранённый токен, чтобы не мигать формой логина
  // при каждом обновлении страницы.
  const [status, setStatus] = useState(() => (getToken() ? 'checking' : 'anon'));
  const [email, setEmail] = useState(null);
  const [tab, setTab] = useState('products');

  const handleUnauthorized = useCallback(() => {
    setStatus('anon');
    setEmail(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (status !== 'checking') return;
    let cancelled = false;

    adminMe()
      .then((data) => {
        if (cancelled) return;
        setEmail(data.admin?.email ?? null);
        setStatus('auth');
      })
      .catch(() => {
        // 401 уже обработан в adminApi (токен стёрт, handleUnauthorized вызван);
        // здесь ловим остальное — например, недоступный бэкенд.
        if (!cancelled) setStatus('anon');
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === 'checking') {
    return <div className="admin-page admin-page-loading">Проверяем доступ...</div>;
  }

  if (status !== 'auth') {
    return (
      <LoginScreen
        onSuccess={(adminEmail) => {
          setEmail(adminEmail);
          setStatus('auth');
        }}
      />
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'admin-tab admin-tab-active' : 'admin-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-account">
          <span>{email}</span>
          <button
            type="button"
            className="admin-logout"
            onClick={() => {
              adminLogout();
              handleUnauthorized();
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="admin-content">
        {tab === 'products' && <ProductsTab />}
        {tab === 'collections' && <CollectionsTab />}
        {tab === 'media' && <MediaTab />}
        {tab === 'orders' && <OrdersTab />}
      </main>
    </div>
  );
}