import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';

import SpatialCanvas   from '../components/SpatialCanvas';
import PlayerControls  from '../components/PlayerControls';
import useAudioStore   from '../store/audioStore';
import useSpatialAudio from '../hooks/useSpatialAudio';
import useAuth         from '../hooks/useAuth';
import { songsApi }    from '../services/api';
import { STEM_COLORS } from '../constants';

const POLL_INTERVAL = 4000;
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export default function Studio() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [demoSongs,    setDemoSongs]    = useState([]);
  const [mySongs,      setMySongs]      = useState([]);
  const [loadingLib,   setLoadingLib]   = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [uploadErr,    setUploadErr]    = useState('');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);

  const fileInputRef  = useRef(null);
  const pollTimersRef = useRef({});
  const rafRef        = useRef(null);

  const {
    currentSong, stems, nodePositions, isPlaying,
    stemMutes, masterVolume,
    setCurrentSong, updateNodePosition, setIsPlaying,
    toggleMute, setMasterVolume,
  } = useAudioStore();

  const audio = useSpatialAudio();

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  // Load song library
  const loadLibrary = useCallback(async () => {
    setLoadingLib(true);
    try {
      const [demos, mine] = await Promise.all([
        songsApi.getDemos().then((r) => r.data).catch(() => []),
        songsApi.getMySongs().then((r) => r.data).catch(() => []),
      ]);
      setDemoSongs(demos);
      setMySongs(mine);
      mine.forEach((song) => {
        if (song.status === 'pending' || song.status === 'processing') startPolling(song.id);
      });
    } finally {
      setLoadingLib(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { if (!authLoading && user) loadLibrary(); }, [authLoading, user]); // eslint-disable-line

  // Polling
  const startPolling = (songId) => {
    if (pollTimersRef.current[songId]) return;
    pollTimersRef.current[songId] = setInterval(async () => {
      try {
        const updated = await songsApi.getSong(songId).then((r) => r.data);
        if (updated.status === 'complete' || updated.status === 'error') {
          clearInterval(pollTimersRef.current[songId]);
          delete pollTimersRef.current[songId];
          setMySongs((prev) => prev.map((s) => (s.id === songId ? updated : s)));
        }
      } catch (_) {}
    }, POLL_INTERVAL);
  };

  useEffect(() => {
    return () => Object.values(pollTimersRef.current).forEach(clearInterval);
  }, []);

  // RAF-based playback time tracking
  useEffect(() => {
    if (isPlaying) {
      const tick = () => {
        setCurrentTime(audio.getCurrentTime());
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setCurrentTime(audio.getCurrentTime());
    }
  }, [isPlaying]); // eslint-disable-line

  // Select song
  const selectSong = async (song) => {
    if (song.status !== 'complete' || !song.stems?.length) return;
    if (isPlaying) audio.pause();
    audio.resetOffset();
    setCurrentSong(song);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoadingAudio(true);
    try {
      await audio.loadStems(song.stems);
      setDuration(audio.getDuration());
    } catch (err) {
      console.error('Failed to load audio:', err);
    } finally {
      setLoadingAudio(false);
    }
  };

  // Play / Pause
  const handlePlayPause = useCallback(() => {
    if (!currentSong || loadingAudio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play(stems, nodePositions, stemMutes, masterVolume);
      setIsPlaying(true);
    }
  }, [isPlaying, currentSong, loadingAudio, stems, nodePositions, stemMutes, masterVolume, audio, setIsPlaying]);

  // Seek
  const handleSeek = useCallback((newTime) => {
    const wasPlaying = audio.seek(newTime);
    setCurrentTime(newTime);
    if (wasPlaying) {
      audio.play(stems, nodePositions, stemMutes, masterVolume);
    }
  }, [audio, stems, nodePositions, stemMutes, masterVolume]);

  // Node drag
  const handlePositionChange = useCallback((stemId, x, y) => {
    updateNodePosition(stemId, x, y);
    if (isPlaying) audio.updatePosition(stemId, x, y);
  }, [isPlaying, updateNodePosition, audio]);

  // Mute toggle
  const handleToggleMute = useCallback((stemId) => {
    const nextMuted = !stemMutes[stemId];
    toggleMute(stemId);
    audio.setMute(stemId, nextMuted);
  }, [stemMutes, toggleMute, audio]);

  // Volume
  const handleVolumeChange = useCallback((v) => {
    setMasterVolume(v);
    audio.setMasterVolume(v);
  }, [setMasterVolume, audio]);

  // Upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);
    setUploadPct(0);
    try {
      const res     = await songsApi.upload(file, (pct) => setUploadPct(pct));
      const newSong = res.data;
      setMySongs((prev) => [newSong, ...prev]);
      startPolling(newSong.id);
    } catch (err) {
      setUploadErr(err.response?.data?.detail ?? 'Upload failed. Try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Delete song
  const handleDelete = async (songId) => {
    if (!confirm('Delete this song and all its stems?')) return;
    try {
      await songsApi.deleteSong(songId);
      setMySongs((prev) => prev.filter((s) => s.id !== songId));
      if (currentSong?.id === songId) {
        if (isPlaying) audio.pause();
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (_) {}
  };

  // Logout
  const handleLogout = () => {
    if (isPlaying) audio.pause();
    logout();
    navigate('/');
  };

  if (authLoading) return <div style={styles.splash}>Loading…</div>;

  const uploadDisabled = DEMO_MODE || uploading || mySongs.length >= 3;

  return (
    <div style={styles.root}>

      {/* Top bar */}
      <header style={styles.topBar}>
        <span style={styles.logo}>PRISM</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ opacity: 0.3, fontSize: 12 }}>{user?.email}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* Main */}
      <div style={styles.main}>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <section>
            <h2 style={styles.sectionTitle}>Demo Songs</h2>
            {loadingLib ? (
              <p style={styles.hint}>Loading…</p>
            ) : demoSongs.length === 0 ? (
              <p style={styles.hint}>Run seed_demos.py to load demos.</p>
            ) : (
              <ul style={styles.songList}>
                {demoSongs.map((song) => (
                  <SongItem key={song.id} song={song} active={currentSong?.id === song.id} onClick={() => selectSong(song)} />
                ))}
              </ul>
            )}
          </section>

          <div style={styles.divider} />

          <section>
            <h2 style={styles.sectionTitle}>My Songs</h2>
            <div style={{ marginBottom: 12 }}>
              <input ref={fileInputRef} type="file" accept=".mp3,.wav,.flac,.m4a,.ogg,.aac" onChange={handleUpload} style={{ display: 'none' }} />
              <button
                onClick={() => !uploadDisabled && fileInputRef.current?.click()}
                disabled={uploadDisabled}
                style={{ ...styles.uploadBtn, opacity: uploadDisabled ? 0.35 : 1, cursor: uploadDisabled ? 'not-allowed' : 'pointer' }}
              >
                {DEMO_MODE
                  ? 'Uploads disabled in demo'
                  : uploading
                    ? `Uploading… ${uploadPct}%`
                    : mySongs.length >= 3
                      ? 'Limit reached (3/3)'
                      : '+ Upload song'}
              </button>
              {uploadErr && <p style={styles.uploadErr}>{uploadErr}</p>}
              {DEMO_MODE
                ? <p style={styles.hint}>Demo mode — upload is unavailable.</p>
                : <p style={styles.hint}>{mySongs.length}/3 uploads used</p>}
            </div>
            {mySongs.length === 0 && !loadingLib && !DEMO_MODE && <p style={styles.hint}>No songs yet. Upload an MP3, WAV or FLAC.</p>}
            <ul style={styles.songList}>
              {mySongs.map((song) => (
                <SongItem key={song.id} song={song} active={currentSong?.id === song.id} onClick={() => selectSong(song)} onDelete={() => handleDelete(song.id)} />
              ))}
            </ul>
          </section>
        </aside>

        {/* Canvas area */}
        <main style={styles.canvasArea}>
          {!currentSong ? (
            <div style={styles.empty}>
              <p style={{ opacity: 0.55, fontSize: 14, textAlign: 'center', lineHeight: 1.8 }}>
                Select a song from the sidebar<br />to open the spatial mixer.
              </p>
            </div>
          ) : loadingAudio ? (
            <div style={styles.empty}><p style={{ opacity: 0.4, fontSize: 13 }}>Decoding audio…</p></div>
          ) : (
            <>
              <SpatialCanvas onPositionChange={handlePositionChange} />
              <p style={styles.canvasTip}>Drag nodes · distance = volume · angle = direction · wear headphones</p>
            </>
          )}
        </main>

        {/* Right stem panel */}
        <aside style={styles.rightPanel}>
          <h2 style={styles.sectionTitle}>Stems</h2>
          {stems.length > 0 ? (
            <div style={styles.stemControls}>
              {stems.map((stem) => {
                const color = STEM_COLORS[stem.stem_type] ?? '#888';
                const muted = stemMutes[stem.id];
                return (
                  <button
                    key={stem.id}
                    onClick={() => handleToggleMute(stem.id)}
                    title={`${muted ? 'Unmute' : 'Mute'} ${stem.stem_type}`}
                    style={{
                      ...styles.stemToggle,
                      borderColor: muted ? 'rgba(255,255,255,0.08)' : `${color}66`,
                      color: muted ? 'rgba(255,255,255,0.25)' : color,
                      background: muted ? 'rgba(255,255,255,0.02)' : `${color}12`,
                    }}
                  >
                    <span style={{ ...styles.stemDot, background: muted ? 'rgba(255,255,255,0.12)' : color }} />
                    <span style={styles.stemLabel}>{stem.stem_type}</span>
                    <span style={{ ...styles.stemMuteHint, opacity: muted ? 0.6 : 0.3 }}>{muted ? 'off' : 'on'}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={styles.hint}>Load a song to see stems.</p>
          )}
        </aside>

      </div>

      {/* Player bar */}
      <PlayerControls
        onPlayPause={handlePlayPause}
        onVolumeChange={handleVolumeChange}
        onSeek={handleSeek}
        currentTime={currentTime}
        duration={duration}
      />
    </div>
  );
}

function SongItem({ song, active, onClick, onDelete }) {
  const statusColor = { complete: '#34d399', processing: '#fbbf24', pending: '#fbbf24', error: '#f87171' }[song.status] ?? '#888';
  return (
    <li
      onClick={song.status === 'complete' ? onClick : undefined}
      style={{ ...styles.songItem, background: active ? 'rgba(255,255,255,0.07)' : 'transparent', cursor: song.status === 'complete' ? 'pointer' : 'default', borderColor: active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={styles.songTitle}>{song.title}</div>
          {song.artist && <div style={styles.songArtist}>{song.artist}</div>}
          {(song.status === 'pending' || song.status === 'processing') && <div style={{ ...styles.songArtist, color: '#fbbf24' }}>{song.status === 'processing' ? 'Separating stems…' : 'Queued…'}</div>}
          {song.status === 'error' && <div style={{ ...styles.songArtist, color: '#f87171' }}>Separation failed</div>}
        </div>
      </div>
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={styles.deleteBtn} title="Delete song">✕</button>
      )}
    </li>
  );
}

const styles = {
  root:         { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0a0f', color: '#fff' },
  splash:       { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', opacity: 0.6, fontSize: 14 },
  topBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 },
  logo:         { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.2em', color: '#fff' },
  logoutBtn:    { background: '#fff', border: 'none', color: '#000', padding: '0.45rem 1.1rem', borderRadius: '100px', fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'Poppins', sans-serif", fontWeight: 300, cursor: 'pointer' },
  main:         { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:      { width: 240, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 4 },
  sectionTitle: { fontSize: 10, letterSpacing: '0.15em', opacity: 0.45, marginBottom: 12, textTransform: 'uppercase' },
  divider:      { height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' },
  songList:     { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 },
  songItem:     { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 6, border: '1px solid', transition: 'background 0.15s' },
  songTitle:    { fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  songArtist:   { fontSize: 10, opacity: 0.4, marginTop: 1 },
  deleteBtn:    { background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 11, cursor: 'pointer', padding: '2px 4px', flexShrink: 0 },
  uploadBtn:    { width: '100%', padding: '9px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'inherit', marginBottom: 6, transition: 'opacity 0.15s' },
  uploadErr:    { color: '#f87171', fontSize: 11, marginTop: 4 },
  hint:         { fontSize: 11, opacity: 0.4, lineHeight: 1.5, marginBottom: 8 },
  canvasArea:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, overflow: 'auto' },
  empty:        { display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 },
  canvasTip:    { fontSize: 11, opacity: 0.2, textAlign: 'center' },
  rightPanel:   { width: 200, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4 },
  stemControls: { display: 'flex', flexDirection: 'column', gap: 6 },
  stemToggle:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid', background: 'transparent', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s', width: '100%' },
  stemDot:      { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, transition: 'background 0.15s' },
  stemLabel:    { flex: 1, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'capitalize' },
  stemMuteHint: { fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'opacity 0.15s' },
};
