import { Link } from 'react-router-dom';
import './CollectionBlock.css';

// Блок «Категории» — 3 карточки: New Collection / Archive / Sale.
// image: путь к реальному фото, когда оно будет готово (например '/assets/new-collection.jpg').
// link: путь, на который ведёт карточка (пока все ведут на общую карточку товара /product).
// Пока фото нет — рисуется серый плейсхолдер.
const CATEGORIES = [
  { label: 'New Collection', image: null, link: '/product' },
  { label: 'Archive', image: null, link: '/product' },
  { label: 'Sale', image: null, link: '/product' },
];

export default function Categories() {
  return (
    <div className="categories">
      {CATEGORIES.map(({ label, image, link }) => (
        <Link className="categories-card" to={link} key={label}>
          <div
            className="categories-image"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
          <div className="categories-label">
            <span>{label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}