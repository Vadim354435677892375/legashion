import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Intro from './components/Intro';
import Home from './pages/home_page/Home'; // главная страница магазина, блоки — в pages/glavnaya-stranica/blocks
import ProductPage from './pages/product_page/ProductPage'; // карточка товара, блоки — в pages/product_page/blocks
import CartPage from './pages/cart_page/CartPage'; // корзина, блоки — в pages/cart_page/blocks
import CheckoutPage from './pages/checkout_page/CheckoutPage'; // оформление заказа, блоки — в pages/checkout_page/blocks
import CollectionPage from './pages/collection_page/CollectionPage'; // страница коллекции (New Collection / Archive / Sale)

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/home" element={<Home />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/collection/:slug" element={<CollectionPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}