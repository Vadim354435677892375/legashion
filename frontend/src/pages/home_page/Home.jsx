import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
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
  const { totalCount } = useCart();

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
        {totalCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 5px',
              borderRadius: '50%',
              background: '#163a7a',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {totalCount}
          </span>
        )}
      </Link>
      <Player />
      <Categories />
      <Products />
      <ModelsBlock />
      <InfoBlock />
    </div>
  );
}