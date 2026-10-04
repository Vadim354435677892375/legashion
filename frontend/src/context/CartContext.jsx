import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Общий контекст корзины.
// item: { id, productId, name, image, size, price, qty, maxQty }
// maxQty — сколько штук этого размера было в наличии при добавлении (null/нет — без ограничения);
// это лишь удобство для покупателя, реальный остаток всё равно проверяет бэкенд при заказе.
// price здесь — только для показа в корзине; при оформлении заказа бэкенд берёт цену из БД по productId.
// id должен быть уникальным для пары товар+размер (иначе один и тот же товар
// в разных размерах затрёт друг друга).
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const clamp = (qty, max) => (max == null ? qty : Math.min(qty, max));
      if (existing) {
        const maxQty = product.maxQty ?? existing.maxQty;
        return prev.map((i) =>
          i.id === product.id
            ? { ...i, maxQty, qty: clamp(i.qty + (product.qty ?? 1), maxQty) }
            : i
        );
      }
      return [...prev, { ...product, qty: clamp(product.qty ?? 1, product.maxQty) }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, qty: Math.min(Math.max(1, qty), i.maxQty ?? Infinity) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.price, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice }),
    [items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart должен использоваться внутри <CartProvider>');
  return ctx;
}