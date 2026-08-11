import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// При переходе на новую страницу (смена pathname) браузер по умолчанию
// сохраняет прежнюю позицию скролла — из-за этого страница открывается
// «посередине». Этот компонент при каждой смене маршрута прокручивает
// окно наверх. Рендерится один раз внутри <BrowserRouter>, ничего не выводит.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}