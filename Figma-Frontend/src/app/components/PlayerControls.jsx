import useAudioStore from '../store/audioStore';
import { STEM_COLORS } from '../constants';

export default function PlayerControls({ onPlayPause, onVolumeChange, onToggleMute }) {
  const { currentSong, stems, isPlaying, masterVolume, stemMutes } = useAudioStore();

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

      <button onClick={onPlayPause} style={styles.playBtn} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div style={styles.stems}>
        {stems.map((stem) => {
          const color = STEM_COLORS[stem.stem_type] ?? '#888';
          const muted = stemMutes[stem.id];
          return (
            <button
              key={stem.id}
              onClick={() => onToggleMute?.(stem.id)}
              title={`${muted ? 'Unmute' : 'Mute'} ${stem.stem_type}`}
              style={{
                ...styles.stemBtn,
                background: muted ? '#1a1a22' : color,
                color:      muted ? color : '#000',
                border:     `1px solid ${color}`,
                opacity:    muted ? 0.5 : 1,
              }}
            >
              {stem.stem_type.slice(0, 3).toUpperCase()}
            </button>
          );
        })}
      </div>

      <div style={styles.volWrap}>
        <span style={{ opacity: 0.4, fontSize: 11, marginRight: 6 }}>VOL</span>
        <input
          type="range" min={0} max={1} step={0.01} value={masterVolume}
          onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
          style={styles.slider}
        />
      </div>
    </div>
  );
}

const styles = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 20,
    padding: '14px 24px',
    background: 'rgba(255,255,255,0.03)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(10px)', flexWrap: 'wrap',
  },
  info:    { display: 'flex', flexDirection: 'column', gap: 2, flex: '0 0 180px' },
  title:   { fontWeight: 600, fontSize: 14, letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 },
  meta:    { opacity: 0.4, fontSize: 11 },
  playBtn: { width: 44, height: 44, borderRadius: '50%', background: '#fff', color: '#000', border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  stems:   { display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 },
  stemBtn: { padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '0.05em', cursor: 'pointer', transition: 'opacity 0.15s' },
  volWrap: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  slider:  { width: 90, cursor: 'pointer', accentColor: '#fff' },
};
