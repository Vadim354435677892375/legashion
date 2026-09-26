import { useRef, useState } from 'react';
import './Gallery.css';

// Минимальное расстояние свайпа в пикселях, после которого считаем,
// что пользователь листает фото, а не просто задел его пальцем.
const SWIPE_THRESHOLD = 40;

// Блок «Галерея товара» — большое фото + стрелки переключения + превью снизу.
// images: массив путей к фото товара (например ['/assets/product-1.jpg', ...]).
// Пока фото нет — рисуется белый плейсхолдер вместо картинки.
// В адаптиве (на сенсорных экранах) фото дополнительно листается свайпом.
export default function Gallery({ images = [] }) {
  const slots = images.length > 0 ? images : [null, null, null];
  const [active, setActive] = useState(0);

  const prev = () => setActive((i) => (i - 1 + slots.length) % slots.length);
  const next = () => setActive((i) => (i + 1) % slots.length);

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (slots.length > 1) {
      if (touchDeltaX.current <= -SWIPE_THRESHOLD) {
        next();
      } else if (touchDeltaX.current >= SWIPE_THRESHOLD) {
        prev();
      }
    }
    touchDeltaX.current = 0;
  };

  return (
    <div className="gallery">
      <div className="gallery-main">
        <button className="gallery-arrow left" aria-label="Предыдущее фото" onClick={prev}>
          ←
        </button>

        <div
          className="gallery-image"
          style={slots[active] ? { backgroundImage: `url(${slots[active]})` } : undefined}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <button className="gallery-arrow right" aria-label="Следующее фото" onClick={next}>
          →
        </button>
      </div>

      <div className="gallery-thumbs">
        {slots.map((src, i) => (
          <button
            key={i}
            type="button"
            className={`gallery-thumb${i === active ? ' active' : ''}`}
            style={src ? { backgroundImage: `url(${src})` } : undefined}
            onClick={() => setActive(i)}
            aria-label={`Показать фото ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}