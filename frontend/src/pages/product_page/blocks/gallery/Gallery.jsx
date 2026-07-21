import { useState } from 'react';
import './Gallery.css';

// Блок «Галерея товара» — большое фото + стрелки переключения + превью снизу.
// images: массив путей к фото товара (например ['/assets/product-1.jpg', ...]).
// Пока фото нет — рисуется белый плейсхолдер вместо картинки.
export default function Gallery({ images = [] }) {
  const slots = images.length > 0 ? images : [null, null, null];
  const [active, setActive] = useState(0);

  const prev = () => setActive((i) => (i - 1 + slots.length) % slots.length);
  const next = () => setActive((i) => (i + 1) % slots.length);

  return (
    <div className="gallery">
      <div className="gallery-main">
        <button className="gallery-arrow left" aria-label="Предыдущее фото" onClick={prev}>
          ←
        </button>

        <div
          className="gallery-image"
          style={slots[active] ? { backgroundImage: `url(${slots[active]})` } : undefined}
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