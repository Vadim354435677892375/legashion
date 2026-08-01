import { Link } from 'react-router-dom';
import Player from './blocks/player/Player';
import Categories from './blocks/collection/CollectionBlock';
import Products from './blocks/products/Products';
import ModelsBlock from './blocks/modelblock/ModelsBlock';
import InfoBlock from './blocks/info/InfoBlock';
import cartIcon from '../../assets/icons/cart-icon.png';

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
      {/* Значок корзины в левом верхнем углу. position: fixed — остаётся на месте при прокрутке */}
      <Link
        to="/cart"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '100px',
          zIndex: 1000,
        }}
      >
        <img
          src={cartIcon}
          alt="Корзина"
          style={{
            width: '60px',
            height: 'auto',
            cursor: 'pointer',
            filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))',
          }}
        />
      </Link>
      <Player />
      <Categories />
      <Products />
      <ModelsBlock />
      <InfoBlock />
    </div>
  );
}