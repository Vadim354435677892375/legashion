import './ModelsBlock.css';
import paintFrame from '../../../../assets/paint-frame.png';

// Блок «Фото моделей» — реальный скриншот окна Paint (из макета) как фон,
// а поверх белого холста этого скриншота накладываются фото моделей.
// image: путь к реальному фото модели, когда оно будет готово (например '/assets/models/look-1.jpg').
// Пока фото нет — рисуется светлый плейсхолдер.
const MODELS = [
  { image: null, alt: 'Look 1' },
  { image: null, alt: 'Look 2' },
  { image: null, alt: 'Look 3' },
];

export default function ModelsBlock() {
  return (
    <div className="paint-window">
      <img className="paint-window-bg" src={paintFrame} alt="" />
      <div className="paint-canvas-overlay">
        {MODELS.map(({ image, alt }, i) => (
          <div
            className="paint-photo"
            style={image ? { backgroundImage: `url(${image})` } : undefined}
            key={`${alt}-${i}`}
            role="img"
            aria-label={alt}
          />
        ))}
      </div>
    </div>
  );
}