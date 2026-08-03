import { useRef } from 'react';
import { Link } from 'react-router-dom';
import './CollectionBlock.css';

// Блок «Категории» — карусель карточек: New Collection / Archive / Sale /
// Лонгсливы / Футболки.
// image: путь к реальному фото, когда оно будет готово (например '/assets/new-collection.jpg').
// Пока фото нет — рисуется серый плейсхолдер.
// to: прямой путь на отдельную страницу (например /archive) — используется,
// когда у коллекции своя страница в файловой системе.
// slug: если указан (и нет to) — карточка ведёт на общую страницу коллекции
// (/collection/:slug).
// Если нет ни to, ни slug (страницы пока не готовы) — карточка неактивна ("#").
const CATEGORIES = [
  { label: 'New Collection', image: null, slug: 'new-collection' },
  { label: 'Archive', image: null, to: '/archive' },
  { label: 'Sale', image: null, slug: null },
  { label: 'Лонгсливы', image: null, slug: null },
  { label: 'Футболки', image: null, slug: null },
];

export default function Categories() {
  const trackRef = useRef(null);

  // Листаем на ширину одной карточки (+ отступ), а не на фиксированный
  // пиксель — так работает одинаково корректно и на десктопе (видно 3
  // карточки), и на мобильном (видна 1).
  const scrollByCard = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.categories-card');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap || 20);
    const step = card.getBoundingClientRect().width + gap;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <div className="categories">
      <button
        type="button"
        className="categories-arrow categories-arrow--left"
        aria-label="Предыдущие категории"
        onClick={() => scrollByCard(-1)}
      >
        ←
      </button>

      <div className="categories-track" ref={trackRef}>
        {CATEGORIES.map(({ label, image, slug, to }) => {
          const content = (
            <>
              <div
                className="categories-image"
                style={image ? { backgroundImage: `url(${image})` } : undefined}
              />
              <div className="categories-label">
                <span>{label}</span>
              </div>
            </>
          );

          const href = to || (slug ? `/collection/${slug}` : null);

          return href ? (
            <Link className="categories-card" to={href} key={label}>
              {content}
            </Link>
          ) : (
            <a className="categories-card" href="#" key={label}>
              {content}
            </a>
          );
        })}
      </div>

      <button
        type="button"
        className="categories-arrow categories-arrow--right"
        aria-label="Следующие категории"
        onClick={() => scrollByCard(1)}
      >
        →
      </button>
    </div>
  );
}