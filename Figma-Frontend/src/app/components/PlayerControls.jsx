import useAudioStore from '../store/audioStore';

const fmt = (s) => {
  const m = Math.floor((s || 0) / 60);
  const sec = Math.floor((s || 0) % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function PlayerControls({ onPlayPause, onVolumeChange, onSeek, currentTime = 0, duration = 0 }) {
  const { currentSong, stems, isPlaying, masterVolume } = useAudioStore();

  if (!currentSong) {
    return (
      <div style={styles.bar}>
        <span style={{ opacity: 0.3, fontSize: 13 }}>Select a song to start</span>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <div style={styles.info}>
        <span style={styles.title}>{currentSong.title}</span>
        <span style={styles.meta}>
          {currentSong.artist ? `${currentSong.artist} · ` : ''}
          {stems.length} stems · {currentSong.is_demo ? 'Demo' : 'Your upload'}
        </span>
      </div>

      <div style={styles.seekWrap}>
        <span style={styles.timeLabel}>{fmt(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.5}
          value={currentTime}
          onChange={(e) => onSeek?.(parseFloat(e.target.value))}
          style={styles.seekBar}
        />
        <span style={styles.timeLabel}>{fmt(duration)}</span>
      </div>

      <div style={styles.controls}>
        <button onClick={onPlayPause} style={styles.playBtn} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div style={styles.volWrap}>
          <span style={{ opacity: 0.4, fontSize: 11, marginRight: 6 }}>VOL</span>
          <input
            type="range" min={0} max={1} step={0.01} value={masterVolume}
            onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
            style={styles.slider}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '12px 24px',
    background: 'rgba(255,255,255,0.03)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)', flexShrink: 0,
  },
  info:      { display: 'flex', flexDirection: 'column', gap: 2, flex: '0 0 180px' },
  title:     { fontWeight: 600, fontSize: 14, letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 },
  meta:      { opacity: 0.4, fontSize: 11 },
  seekWrap:  { flex: 1, display: 'flex', alignItems: 'center', gap: 10 },
  seekBar:   { flex: 1, cursor: 'pointer', accentColor: '#a78bfa' },
  timeLabel: { fontSize: 11, opacity: 0.45, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'center' },
  controls:  { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 },
  playBtn:   { width: 44, height: 44, borderRadius: '50%', background: '#fff', color: '#000', border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  volWrap:   { display: 'flex', alignItems: 'center', flexShrink: 0 },
  slider:    { width: 90, cursor: 'pointer', accentColor: '#fff' },
};
