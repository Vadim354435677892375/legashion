import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Intro from './components/Intro';
import Home from './pages/Home'; // ваша будущая главная страница магазина

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