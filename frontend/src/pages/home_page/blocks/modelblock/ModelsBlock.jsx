import './ModelsBlock.css';
import paintFrame from '../../../../assets/paint-frame.png';
import { useSiteMedia } from '../../../../hooks/useSiteMedia';
import FadeBg from '../../../../components/FadeBg';

// Блок «Фото моделей» — реальный скриншот окна Paint (из макета) как фон,
// а поверх белого холста этого скриншота накладываются фото моделей.
// mediaKey: ключ слота с фото — загружается в админке (Медиа → «Главная — фото моделей»).
// Пока фото не загружено — рисуется светлый плейсхолдер.
const MODELS = [
  { mediaKey: 'models.look-1', alt: 'Look 1' },
  { mediaKey: 'models.look-2', alt: 'Look 2' },
  { mediaKey: 'models.look-3', alt: 'Look 3' },
];

export default function ModelsBlock() {
  const media = useSiteMedia();
  return (
    <div className="paint-window">
      <img className="paint-window-bg" src={paintFrame} alt="" />
      <div className="paint-canvas-overlay">
        {MODELS.map(({ mediaKey, alt }) => {
          const image = media.get(mediaKey);
          return (
            <FadeBg
              src={image}
              className="paint-photo"
              key={mediaKey}
              role="img"
              aria-label={alt}
            />
          );
        })}
      </div>
    </div>
  );
}