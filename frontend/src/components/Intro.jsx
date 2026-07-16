import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';
import bg from '../assets/bg.gif';
import logo from '../assets/logo-glitch.gif';

export default function Intro() {
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

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
      style={{ backgroundImage: `url(${bg})` }}
    >
      <img className="logo" src={logo} alt="LEGASHION" />
      <div className="enter">ENTER</div>
      <div className="hint">нажмите в любом месте экрана или Enter</div>
    </div>
  );
}