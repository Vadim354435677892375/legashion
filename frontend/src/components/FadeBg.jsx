import { useEffect, useRef, useState } from 'react';

// Div с фоновой картинкой, которая плавно проявляется (fade-in), а не
// «дёргается» резким появлением на экране. Используется везде, где картинка
// приходит асинхронно — с бэкенда (медиа из админки) или из данных товара —
// и раньше просто мгновенно выскакивала поверх серого плейсхолдера.
//
// Как это работает:
// 1. Пока для текущего src нет предыдущей подгруженной картинки — картинка
//    невидима (opacity: 0), виден плейсхолдер (фон внешнего блока), без рывка.
// 2. Новая картинка подгружается в фоне через new Image(); пока она грузится,
//    на экране остаётся прежнее фото (если было) — без вспышки серого.
// 3. Как только картинка готова — она показывается с плавным fade-in
//    (opacity 0 → 1, transition ~0.3s).
//
// Технически это ДВА слоя: внешний div получает переданные className/style/
// обработчики как раньше (это важно — у карточек уже есть свои transition
// на hover, transform в каруселях и т.п., и нельзя перебивать их своим);
// картинка и плавное появление живут во внутреннем слое, который просто
// растянут на всю площадь внешнего блока.
//
// Стили — один раз вставляются в <head> при первой загрузке модуля,
// отдельный .css-файл не нужен (тот же приём, что и в ProductCard.jsx).

const STYLE_ID = 'fade-bg-styles';

const CSS = `
.fade-bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.fade-bg-layer.is-visible {
  opacity: 1;
}
.fade-bg-layer.contain {
  background-size: contain;
}
`;

if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const styleTag = document.createElement('style');
  styleTag.id = STYLE_ID;
  styleTag.textContent = CSS;
  document.head.appendChild(styleTag);
}

/**
 * @param {string|null|undefined} src — url картинки, либо falsy, если фото ещё нет
 * @param {string} [className] — классы внешнего блока (те же, что были у обычного div)
 * @param {object} [style] — инлайн-стили внешнего блока (например transform для карусели)
 * @param {boolean} [contain] — true для background-size: contain вместо cover
 *   (например фото товара на карточке, которое не должно обрезаться)
 * @param {import('react').ReactNode} [children] — рендерятся поверх картинки, вне fade-слоя
 * ...rest — прокидывается на внешний div как есть (onTouchStart, aria-label и т.п.)
 */
export default function FadeBg({ src, className = '', style, contain = false, children, ...rest }) {
  const [shownSrc, setShownSrc] = useState(src || null);
  const [visible, setVisible] = useState(Boolean(src));
  const requestedSrc = useRef(src);

  useEffect(() => {
    requestedSrc.current = src;

    if (!src) {
      setVisible(false);
      return undefined;
    }
    if (src === shownSrc) {
      setVisible(true);
      return undefined;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || requestedSrc.current !== src) return;
      setShownSrc(src);
      setVisible(true);
    };
    img.onerror = () => {
      if (cancelled || requestedSrc.current !== src) return;
      setVisible(false);
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
    // shownSrc намеренно не в зависимостях — сравнение идёт внутри эффекта,
    // а добавление в deps приводило бы к лишним перезапускам загрузки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className={className} style={style} {...rest}>
      <div
        className={`fade-bg-layer${visible ? ' is-visible' : ''}${contain ? ' contain' : ''}`}
        style={shownSrc ? { backgroundImage: `url(${shownSrc})` } : undefined}
      />
      {children}
    </div>
  );
}