import { useCallback, useEffect, useState } from 'react';
import ProductForm from './ProductForm';
import { adminDelete, adminGet } from '../../../utils/adminApi';
import { formatPrice, getDiscountedPrice } from '../../../utils/pricing';

// Вкладка «Товары»: список + форма создания/редактирования.
// В отличие от публичного /api/products, админский GET отдаёт и выключенные
// товары (isActive: false), поэтому их видно и можно включить обратно.

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null — форма закрыта, 'new' — создание, объект — редактирование
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, collectionsData] = await Promise.all([
        adminGet('/api/admin/products'),
        adminGet('/api/admin/collections'),
      ]);
      setProducts(productsData);
      setCollections(collectionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Удалить «${product.name}»?\n\nЕсли на товар уже есть заказы, он не удалится, а просто станет неактивным — история заказов не теряется.`
    );
    if (!confirmed) return;

    try {
      await adminDelete(`/api/admin/products/${product.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (editing) {
    return (
      <ProductForm
        product={editing === 'new' ? null : editing}
        collections={collections}
        onCancel={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load();
        }}
      />
    );
  }

  return (
    <section className="admin-section">
      <div className="admin-section-head">
        <h2>Товары {!loading && <span className="admin-count">{products.length}</span>}</h2>
        <button type="button" className="admin-primary" onClick={() => setEditing('new')}>
          + Добавить товар
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-muted">Загрузка...</p>}

      {!loading && products.length === 0 && (
        <p className="admin-muted">
          Товаров пока нет. Нажми «Добавить товар» — он сразу появится в магазине.
        </p>
      )}

      <div className="admin-cards">
        {products.map((product) => (
          <article
            key={product.id}
            className={product.isActive ? 'admin-card' : 'admin-card admin-card-off'}
          >
            <div
              className="admin-card-photo"
              style={
                product.images[0] ? { backgroundImage: `url(${product.images[0].url})` } : undefined
              }
            >
              {!product.images[0] && <span className="admin-card-nophoto">нет фото</span>}
            </div>

            <div className="admin-card-body">
              <h3>{product.name}</h3>

              <p className="admin-card-price">
                {product.discountPercent > 0 ? (
                  <>
                    <s>{formatPrice(product.price)}</s>{' '}
                    {formatPrice(getDiscountedPrice(product.price, product.discountPercent))}{' '}
                    <span className="admin-badge admin-badge-sale">
                      −{product.discountPercent}%
                    </span>
                  </>
                ) : (
                  formatPrice(product.price)
                )}
              </p>

              <p className="admin-card-meta">
                {product.collectionSlugs.length > 0
                  ? product.collectionSlugs.join(', ')
                  : 'без коллекций — на сайте не появится'}
              </p>

              {!product.isActive && <span className="admin-badge">выключен</span>}
            </div>

            <div className="admin-card-actions">
              <button type="button" onClick={() => setEditing(product)}>
                Редактировать
              </button>
              <button type="button" className="admin-danger" onClick={() => handleDelete(product)}>
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}