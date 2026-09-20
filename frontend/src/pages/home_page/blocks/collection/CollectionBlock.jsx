import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSiteMedia } from '../../../../hooks/useSiteMedia';
import './CollectionBlock.css';

// Блок «Категории» — карусель карточек: New Collection / Archive / Sale /
// Лонгсливы / Футболки.
// mediaKey: ключ слота с фото карточки — фото загружается в админке (Медиа → «Главная —
// карточки категорий»). Пока фото не загружено — рисуется серый плейсхолдер.
// to: прямой путь на отдельную страницу (например /archive) — используется,
// когда у коллекции своя страница в файловой системе.
// slug: если указан (и нет to) — карточка ведёт на общую страницу коллекции
// (/collection/:slug).
// Если нет ни to, ни slug (страницы пока не готовы) — карточка неактивна ("#").
const CATEGORIES = [
  { label: 'New Collection', mediaKey: 'categories.new-collection', slug: 'new-collection' },
  { label: 'Archive', mediaKey: 'categories.archive', to: '/archive' },
  { label: 'Sale', mediaKey: 'categories.sale', to: '/sale' },
  { label: 'Лонгсливы', mediaKey: 'categories.longsleeves', slug: null },
  { label: 'Футболки', mediaKey: 'categories.tshirts', to: '/tshirts' },
];

export default function Categories() {
  const trackRef = useRef(null);
  const media = useSiteMedia();

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
        {CATEGORIES.map(({ label, mediaKey, slug, to }) => {
          const image = media.get(mediaKey);
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