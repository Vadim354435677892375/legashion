import { Link } from 'react-router-dom';
import './CollectionBlock.css';

// Блок «Категории» — 3 карточки: New Collection / Archive / Sale.
// image: путь к реальному фото, когда оно будет готово (например '/assets/new-collection.jpg').
// Пока фото нет — рисуется серый плейсхолдер.
// slug: если указан — карточка ведёт на страницу коллекции (/collection/:slug).
// Если slug нет (Archive, Sale — страниц пока нет) — карточка остаётся неактивной ("#").
const CATEGORIES = [
  { label: 'New Collection', image: null, slug: 'new-collection' },
  { label: 'Archive', image: null, slug: null },
  { label: 'Sale', image: null, slug: null },
];

export default function Categories() {
  return (
    <div className="categories">
      {CATEGORIES.map(({ label, image, slug }) => {
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

        return slug ? (
          <Link className="categories-card" to={`/collection/${slug}`} key={label}>
            {content}
          </Link>
        ) : (
          <a className="categories-card" href="#" key={label}>
            {content}
          </a>
        );
      })}
    </div>
  );
}