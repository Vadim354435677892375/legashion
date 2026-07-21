import Player from './blocks/player/Player';
import Categories from './blocks/collection/CollectionBlock';
import Products from './blocks/products/Products';

// Главная страница магазина.
// Каждый визуальный блок из макета Figma живёт в своей папке внутри ./blocks
// и подключается сюда по мере готовности.
export default function GlavnayaStranica() {
  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#fff',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        padding: '48px 20px',
      }}
    >
      <Player />
      <Categories />
      <Products />
    </div>
  );
}