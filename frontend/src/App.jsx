import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './components/Intro';
import Home from './pages/home_page/Home'; // главная страница магазина, блоки — в pages/glavnaya-stranica/blocks

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}