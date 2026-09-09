import Player from './blocks/player/Player';
import Categories from './blocks/collection/CollectionBlock';
import Products from './blocks/products/Products';
import ModelsBlock from './blocks/modelblock/ModelsBlock';
import InfoBlock from './blocks/info/InfoBlock';
import CartButton from '../../components/CartButton';
import './Home.css';

// Главная страница магазина.
// Каждый визуальный блок из макета Figma живёт в своей папке внутри ./blocks
// и подключается сюда по мере готовности.
export default function GlavnayaStranica() {
  return (
    <div className="home-page">
      <CartButton />
      <Player />
      <Categories />
      <Products />
      <ModelsBlock />
      <InfoBlock />
    </div>
  );
}