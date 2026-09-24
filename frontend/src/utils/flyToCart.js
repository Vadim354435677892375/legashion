// Анимация «полёта» красной точки из кнопки в корзину.
// Точка летит по дуге (квадратичная кривая Безье), уменьшается и оставляет
// за собой короткий шлейф. Возвращает Promise, который резолвится, когда
// головная точка «приземлилась» — в этот момент показываем кружок с цифрой.
const TRAIL = 4; // головная точка + 3 хвостовых

export function flyToCart(fromEl, to) {
  return new Promise((resolve) => {
    if (!fromEl || typeof document.body.animate !== 'function') {
      resolve();
      return;
    }

    const rect = fromEl.getBoundingClientRect();
    const sx = rect.left + rect.width / 2;
    const sy = rect.top + rect.height / 2;
    const { x: ex, y: ey } = to;

    // Контрольная точка поднимает траекторию дугой вверх
    const cx = (sx + ex) / 2 + (sx < ex ? -60 : 60);
    const cy = Math.min(sy, ey) - 140;

    const STEPS = 28;
    const path = Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = i / STEPS;
      const u = 1 - t;
      return {
        x: u * u * sx + 2 * u * t * cx + t * t * ex,
        y: u * u * sy + 2 * u * t * cy + t * t * ey,
        t,
      };
    });

    let pending = TRAIL;
    const dots = [];

    for (let i = 0; i < TRAIL; i++) {
      const size = 20 - i * 3;
      const dot = document.createElement('div');
      dot.className = 'fly-dot';
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.marginLeft = `${-size / 2}px`;
      dot.style.marginTop = `${-size / 2}px`;
      document.body.appendChild(dot);
      dots.push(dot);

      const baseOpacity = 1 - i * 0.28;
      const anim = dot.animate(
        path.map(({ x, y, t }) => ({
          transform: `translate(${x}px, ${y}px) scale(${1.25 - t * 0.6})`,
          opacity: t < 0.05 ? baseOpacity * (t / 0.05) : baseOpacity,
        })),
        {
          duration: 720,
          delay: i * 45,
          easing: 'cubic-bezier(0.55, 0, 0.25, 1)',
          fill: 'both',
        }
      );

      anim.onfinish = () => {
        dot.remove();
        if (i === 0) resolve(); // головная точка долетела
        pending -= 1;
        if (pending === 0) dots.forEach((d) => d.remove());
      };
    }
  });
}
