import { useEffect, useRef, useState } from 'react';
import './Player.css';

// Блок «Плеер» — промо-видео бренда, заглушка в стиле классического Windows Media Player.
// Все кнопки функциональны (play/pause, перемотка, громкость, плейлист, свернуть/развернуть/закрыть).
// Когда будет готов видеоролик — заменить .wmp-placeholder на реальный <video> внутри .wmp-screen.

const DURATION = 105; // 01:45, в секундах — пока нет реального видео
const TRACKS = [
  'Промо-ролик — тизер',
  'Промо-ролик — backstage',
  'Промо-ролик — коллекция',
];

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Player() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(12);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [prevVolume, setPrevVolume] = useState(60);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [track, setTrack] = useState(0);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) return undefined;
    intervalRef.current = setInterval(() => {
      setCurrentTime((t) => {
        if (t + 1 >= DURATION) {
          setPlaying(false);
          return DURATION;
        }
        return t + 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [playing]);

  const togglePlay = () => {
    if (closed) return;
    setPlaying((p) => (currentTime >= DURATION ? (setCurrentTime(0), true) : !p));
  };

  const handleSeek = (e) => setCurrentTime(Number(e.target.value));

  const handleVolume = (e) => {
    const v = Number(e.target.value);
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (muted) {
      setMuted(false);
      setVolume(prevVolume || 60);
    } else {
      setPrevVolume(volume);
      setMuted(true);
      setVolume(0);
    }
  };

  const skip = (delta) => setCurrentTime((t) => Math.min(DURATION, Math.max(0, t + delta)));

  const selectTrack = (i) => {
    setTrack(i);
    setCurrentTime(0);
    setShowPlaylist(false);
  };

  const seekPercent = Math.round((currentTime / DURATION) * 100);
  const volumePercent = muted ? 0 : volume;

  if (closed) {
    return (
      <button className="wmp-reopen" onClick={() => setClosed(false)}>
        <span className="wmp-icon" />
        Открыть Windows Media Player
      </button>
    );
  }

  return (
    <div className={`wmp${maximized ? ' maximized' : ''}`}>
      <div className="wmp-window">
        <div className="wmp-titlebar" onDoubleClick={() => setMinimized((m) => !m)}>
          <div className="wmp-title">
            <span className="wmp-icon" />
            <span>{TRACKS[track]}</span>
          </div>
          <div className="wmp-winbtns">
            <button
              className="wmp-btn-min"
              aria-label="Свернуть"
              aria-pressed={minimized}
              onClick={() => setMinimized((m) => !m)}
            />
            <button
              className="wmp-btn-max"
              aria-label="Развернуть"
              aria-pressed={maximized}
              onClick={() => setMaximized((m) => !m)}
            />
            <button
              className="wmp-btn-close"
              aria-label="Закрыть"
              onClick={() => {
                setPlaying(false);
                setClosed(true);
              }}
            />
          </div>
        </div>

        {!minimized && (
          <div className="wmp-screen">
            <div className="wmp-placeholder">
              <div className={`wmp-play-circle${playing ? ' is-playing' : ''}`} onClick={togglePlay}>
                {playing ? <span className="wmp-pause-icon" /> : <span className="wmp-play-icon" />}
              </div>
              <span className="wmp-placeholder-text">
                {playing ? 'Воспроизведение…' : 'Промо-видео скоро'}
              </span>
            </div>

            {showPlaylist && (
              <ul className="wmp-playlist">
                {TRACKS.map((name, i) => (
                  <li key={name}>
                    <button
                      className={i === track ? 'active' : ''}
                      onClick={() => selectTrack(i)}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {!minimized && (
        <div className="wmp-controls">
          <div className="wmp-seek">
            <span className="wmp-time">{formatTime(currentTime)}</span>
            <input
              className="wmp-range"
              type="range"
              min="0"
              max={DURATION}
              value={currentTime}
              onChange={handleSeek}
              style={{ '--fill': `${seekPercent}%` }}
              aria-label="Перемотка"
            />
            <span className="wmp-time">{formatTime(DURATION)}</span>
          </div>

          <div className="wmp-buttons-row">
            <div className="wmp-transport">
              <button className="wmp-round-btn prev small" aria-label="Назад" onClick={() => skip(-10)} />
              <button
                className={`wmp-round-btn ${playing ? 'pause' : 'play'}`}
                aria-label={playing ? 'Пауза' : 'Воспроизвести'}
                aria-pressed={playing}
                onClick={togglePlay}
              />
              <button className="wmp-round-btn next small" aria-label="Вперёд" onClick={() => skip(10)} />
              <button
                className="wmp-round-btn list small"
                aria-label="Плейлист"
                aria-pressed={showPlaylist}
                onClick={() => setShowPlaylist((p) => !p)}
              />
            </div>

            <div className="wmp-volume">
              <button
                className={`wmp-round-btn small ${muted ? 'muted' : 'mute'}`}
                aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                aria-pressed={muted}
                onClick={toggleMute}
              />
              <input
                className="wmp-range wmp-volume-range"
                type="range"
                min="0"
                max="100"
                value={volumePercent}
                onChange={handleVolume}
                style={{ '--fill': `${volumePercent}%` }}
                aria-label="Громкость"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}