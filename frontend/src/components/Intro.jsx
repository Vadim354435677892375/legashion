import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';
import defaultBg from '../assets/bg.gif';
import defaultLogo from '../assets/logo-glitch.gif';
import { useSiteMedia } from '../hooks/useSiteMedia';

export default function Intro() {
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();
  // Фон и логотип можно заменить в админке (вкладка «Медиа»); иначе — встроенные.
  const media = useSiteMedia();
  const bg = media.get('intro.background', defaultBg);
  const logo = media.get('brand.logo', defaultLogo);

  const goToSite = useCallback(() => {
    setLeaving((prev) => {
      if (prev) return prev; // уже уходим, повторный клик игнорируем
      setTimeout(() => navigate('/home'), 900);
      return true;
    });
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') goToSite();
    };
    document.addEventListener('click', goToSite);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', goToSite);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToSite]);

  return (
    <div
      className={`scene${leaving ? ' leaving' : ''}`}
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      {logo && <img className="logo" src={logo} alt="LEGASHION" />}
      <div className="enter">ENTER</div>
      <div className="hint">нажмите в любом месте экрана или Enter</div>
    </div>
  );
}