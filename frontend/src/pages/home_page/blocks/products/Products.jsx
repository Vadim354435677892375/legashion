import './Products.css';

// Блок «Товары» — сетка карточек 2 в ряд.
// image: путь к реальному фото товара, когда оно будет готово (например '/assets/products/eminem-tee.jpg').
// Пока фото нет — рисуется серый плейсхолдер.
const PRODUCTS = [
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
  { name: 'T-shirt "Eminem"', price: 1800, image: null },
];

function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} \u20BD`;
}

export default function Products() {
  return (
    <div className="products">
      {PRODUCTS.map(({ name, price, image }, i) => (
        <a className="product-card" href={`/product/${i}`} key={`${name}-${i}`}>
          <div
            className="product-image"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
          />
          <div className="product-info">
            <div className="product-name">{name}</div>
            <div className="product-price">{formatPrice(price)}</div>
          </div>
        </a>
      ))}
    </div>
  );
}