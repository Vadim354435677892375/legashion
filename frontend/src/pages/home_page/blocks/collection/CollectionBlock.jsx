import './CollectionBlock.css';

// Блок «Категории» — 3 карточки: New Collection / Archive / Sale.
// image: путь к реальному фото, когда оно будет готово (например '/assets/new-collection.jpg').
// Пока фото нет — рисуется серый плейсхолдер.
const CATEGORIES = [
  { label: 'New Collection', image: null },
  { label: 'Archive', image: null },
  { label: 'Sale', image: null },
];

export default function Categories() {
  return (
    <div className="categories">
      {CATEGORIES.map(({ label, image }) => (
        <a className="categories-card" href="#" key={label}>
          <div
            className="categories-image"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
          <div className="categories-label">
            <span>{label}</span>
          </div>
        </a>
      ))}
    </div>
  );
}