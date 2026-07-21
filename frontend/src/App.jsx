import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './components/Intro';
import Home from './pages/home_page/Home'; // главная страница магазина, блоки — в pages/glavnaya-stranica/blocks
import ProductPage from './pages/product_page/Productpage'; // карточка товара, блоки — в pages/product_page/blocks

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<Home />} />
        <Route path="/product" element={<ProductPage />} />
      </Routes>
    </BrowserRouter>
  );
}