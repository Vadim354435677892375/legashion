import Player from './blocks/player/Player';
import Categories from './blocks/collection/CollectionBlock';
import Products from './blocks/products/Products';
import ModelsBlock from './blocks/modelblock/ModelsBlock';
import InfoBlock from './blocks/info/InfoBlock';
import CartButton from '../../components/CartButton';

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
      <CartButton />
      <Player />
      <Categories />
      <Products />
      <ModelsBlock />
      <InfoBlock />
    </div>
  );
}