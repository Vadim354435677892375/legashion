import { useEffect, useRef, useState } from 'react';
import { useSiteMedia } from '../../../../hooks/useSiteMedia';
import './Player.css';

// Блок «Плеер» — промо-видео бренда в окне классического Windows Media Player.
// Плейлист (ролики + постеры) редактируется в админке: Медиа → «Плеер на главной».
// Пока в плейлисте ничего нет, показывается заглушка «Промо-видео скоро» с неактивными
// кнопками. Все кнопки работают с настоящим <video>: play/pause, перемотка ±10 с и ползунок,
// громкость, плейлист (после ролика сам включается следующий), свернуть/развернуть/закрыть.

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Player() {
  const { playerTracks: tracks } = useSiteMedia();
  const hasTracks = tracks.length > 0;

  const [track, setTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(60);
  const [prevVolume, setPrevVolume] = useState(60);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const videoRef = useRef(null);
  // Что сделать, когда у только что созданного <video> загрузятся метаданные:
  // начать играть (выбрали ролик из списка / закончился предыдущий) и/или перемотать
  // туда, где остановились до сворачивания окна.
  const startPlayingRef = useRef(false);
  const resumeAtRef = useRef(null);

  // Плейлист могли укоротить в админке — не выходим за его границы.
  const trackIndex = Math.min(track, Math.max(tracks.length - 1, 0));
  const current = tracks[trackIndex] ?? null;

  // Громкость применяем императивно: у <video> нет атрибута volume. Эффект срабатывает и после
  // смены ролика/разворачивания окна, когда <video> создан заново.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = Math.min(1, Math.max(0, volume / 100));
  }, [muted, volume, current?.id, minimized]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const seekTo = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : seconds;
    const next = Math.min(max, Math.max(0, seconds));
    video.currentTime = next;
    setCurrentTime(next);
  };

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

  // Переключение ролика: новый <video> (key={current.id}) создаётся заново, поэтому
  // сбрасываем счётчики сами, а запуск откладываем до loadedmetadata.
  const openTrack = (index, { autoplay }) => {
    // Тот же ролик: <video> не пересоздаётся, поэтому loadedmetadata не придёт — просто
    // запускаем сначала (иначе флаг автозапуска остался бы висеть до следующей смены ролика).
    if (index === trackIndex) {
      setShowPlaylist(false);
      seekTo(0);
      if (autoplay) videoRef.current?.play().catch(() => {});
      return;
    }
    startPlayingRef.current = autoplay;
    resumeAtRef.current = null;
    setTrack(index);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setShowPlaylist(false);
  };

  const handleMetadata = (e) => {
    const video = e.currentTarget;
    setDuration(video.duration);
    if (resumeAtRef.current !== null) {
      video.currentTime = resumeAtRef.current;
      resumeAtRef.current = null;
    }
    if (startPlayingRef.current) {
      startPlayingRef.current = false;
      video.play().catch(() => {});
    }
  };

  const handleEnded = () => {
    if (trackIndex + 1 < tracks.length) openTrack(trackIndex + 1, { autoplay: true });
    else setPlaying(false);
  };

  // Сворачивание убирает <video> из DOM (как и раньше убирало экран) — запоминаем место,
  // ставим на паузу и при разворачивании возвращаемся на то же место.
  const toggleMinimized = () => {
    if (!minimized) {
      resumeAtRef.current = currentTime;
      setPlaying(false);
    }
    setMinimized((m) => !m);
  };

  const seekPercent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
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
        <div className="wmp-titlebar" onDoubleClick={toggleMinimized}>
          <div className="wmp-title">
            <span className="wmp-icon" />
            <span>{current?.title ?? 'Windows Media Player'}</span>
          </div>
          <div className="wmp-winbtns">
            <button
              className="wmp-btn-min"
              aria-label="Свернуть"
              aria-pressed={minimized}
              onClick={toggleMinimized}
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
                videoRef.current?.pause();
                setPlaying(false);
                setClosed(true);
              }}
            />
          </div>
        </div>

        {!minimized && (
          <div className="wmp-screen">
            {current ? (
              <>
                <video
                  key={current.id}
                  ref={videoRef}
                  className="wmp-video"
                  src={current.videoUrl}
                  poster={current.posterUrl ?? undefined}
                  playsInline
                  preload="metadata"
                  onClick={togglePlay}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={handleEnded}
                  onLoadedMetadata={handleMetadata}
                  onDurationChange={(e) => setDuration(e.currentTarget.duration)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                />
                {!playing && (
                  <div className="wmp-video-overlay">
                    <div className="wmp-play-circle" onClick={togglePlay}>
                      <span className="wmp-play-icon" />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="wmp-placeholder">
                <div className="wmp-play-circle wmp-play-circle--idle">
                  <span className="wmp-play-icon" />
                </div>
                <span className="wmp-placeholder-text">Промо-видео скоро</span>
              </div>
            )}

            {showPlaylist && hasTracks && (
              <ul className="wmp-playlist">
                {tracks.map((item, i) => (
                  <li key={item.id}>
                    <button
                      className={i === trackIndex ? 'active' : ''}
                      onClick={() => openTrack(i, { autoplay: true })}
                    >
                      {item.title}
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
              max={duration > 0 ? duration : 0}
              step="any"
              value={Math.min(currentTime, duration > 0 ? duration : 0)}
              onChange={(e) => seekTo(Number(e.target.value))}
              style={{ '--fill': `${seekPercent}%` }}
              aria-label="Перемотка"
              disabled={!hasTracks}
            />
            <span className="wmp-time">{formatTime(duration)}</span>
          </div>

          <div className="wmp-buttons-row">
            <div className="wmp-transport">
              <button
                className="wmp-round-btn prev small"
                aria-label="Назад"
                onClick={() => seekTo(currentTime - 10)}
                disabled={!hasTracks}
              />
              <button
                className={`wmp-round-btn ${playing ? 'pause' : 'play'}`}
                aria-label={playing ? 'Пауза' : 'Воспроизвести'}
                aria-pressed={playing}
                onClick={togglePlay}
                disabled={!hasTracks}
              />
              <button
                className="wmp-round-btn next small"
                aria-label="Вперёд"
                onClick={() => seekTo(currentTime + 10)}
                disabled={!hasTracks}
              />
              <button
                className="wmp-round-btn list small"
                aria-label="Плейлист"
                aria-pressed={showPlaylist}
                onClick={() => setShowPlaylist((p) => !p)}
                disabled={!hasTracks}
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
