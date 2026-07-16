import './Player.css';

// Блок «Плеер» — промо-видео бренда, заглушка в стиле классического Windows Media Player.
// Когда будет готов видеоролик — заменить .wmp-placeholder на <video> внутри .wmp-screen.
export default function Player() {
  return (
    <div className="wmp">
      <div className="wmp-window">
        <div className="wmp-titlebar">
          <div className="wmp-title">
            <span className="wmp-icon" />
            <span>Windows Media Player</span>
          </div>
          <div className="wmp-winbtns">
            <button className="wmp-btn-min" aria-label="Свернуть" />
            <button className="wmp-btn-max" aria-label="Развернуть" />
            <button className="wmp-btn-close" aria-label="Закрыть" />
          </div>
        </div>

        <div className="wmp-screen">
          <div className="wmp-placeholder">
            <div className="wmp-play-circle" />
            <span className="wmp-placeholder-text">Промо-видео скоро</span>
          </div>
        </div>
      </div>

      <div className="wmp-controls">
        <div className="wmp-seek">
          <span className="wmp-time">00:12</span>
          <div className="wmp-seek-track">
            <div className="wmp-seek-fill" />
            <div className="wmp-seek-thumb" />
          </div>
          <span className="wmp-time">01:45</span>
        </div>

        <div className="wmp-buttons-row">
          <div className="wmp-transport">
            <button className="wmp-round-btn prev small" aria-label="Назад" />
            <button className="wmp-round-btn play" aria-label="Воспроизвести" />
            <button className="wmp-round-btn next small" aria-label="Вперёд" />
            <button className="wmp-round-btn list small" aria-label="Плейлист" />
          </div>

          <div className="wmp-volume">
            <button className="wmp-round-btn mute small" aria-label="Звук" />
            <div className="wmp-volume-track">
              <div className="wmp-volume-fill" />
              <div className="wmp-volume-thumb" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}