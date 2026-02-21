import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from '../hooks/useAuth';

const FEATURES = [
  {
    tag:   '01 — SEPARATE',
    title: 'AI Stem Separation',
    body:  'Upload any track and our pipeline isolates vocals, drums, bass, guitar, piano and more using Meta\'s Demucs — one of the most accurate open-source models available.',
  },
  {
    tag:   '02 — PLACE',
    title: 'Spatial Positioning',
    body:  'Drag each stem node anywhere in a 360° circle around the listener. Distance from centre controls loudness; angle controls direction.',
  },
  {
    tag:   '03 — FEEL',
    title: 'Binaural Rendering',
    body:  'The Web Audio API\'s HRTF panning model uses head-related transfer functions so your brain perceives sound coming from real physical locations — not just left and right. Wear headphones.',
  },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users straight to the studio
  useEffect(() => {
    if (!loading && user) navigate('/studio');
  }, [user, loading, navigate]);

  return (
    <div style={{ background: '#0a0a0f', color: '#fff', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* ── Nav ── */}
      <nav style={styles.nav}>
        <span style={styles.logo}>PRISM</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/auth" style={styles.navLink}>Login</Link>
          <Link to="/auth?mode=signup" style={styles.navCta}>Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={styles.hero}>
        <p style={styles.eyebrow}>Spatial audio · Stem separation · Binaural</p>
        <h1 style={styles.h1}>Sound<br />in Space.</h1>
        <p style={styles.sub}>
          Upload a song. Separate its layers. Place them around you in 3D space.<br />
          Hear music the way it was never meant to be heard.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/auth?mode=signup" style={styles.heroCta}>Start for free</Link>
          <Link to="/studio" style={styles.heroSecondary}>Try a demo song →</Link>
        </div>
      </section>

      {/* ── Feature rows ── */}
      {FEATURES.map(({ tag, title, body }) => (
        <section key={tag} style={styles.feature}>
          <span style={styles.tag}>{tag}</span>
          <h2 style={styles.h2}>{title}</h2>
          <p style={styles.featureBody}>{body}</p>
        </section>
      ))}

      {/* ── CTA strip ── */}
      <section style={styles.ctaStrip}>
        <h2 style={{ fontSize: 36, marginBottom: 24, fontWeight: 700 }}>
          Ready to reshape your listening?
        </h2>
        <Link to="/auth?mode=signup" style={styles.heroCta}>Create free account</Link>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        PRISM — Sound Reimagined ·&nbsp;
        <span style={{ opacity: 0.5 }}>Demo songs by Kevin MacLeod (CC BY 4.0)</span>
      </footer>
    </div>
  );
}

const styles = {
  nav: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '24px 48px',
    borderBottom:   '1px solid rgba(255,255,255,0.06)',
  },
  logo: {
    fontSize:      22,
    fontWeight:    700,
    letterSpacing: '0.25em',
  },
  navLink: {
    opacity:    0.6,
    fontSize:   13,
    transition: 'opacity .15s',
  },
  navCta: {
    background:    '#fff',
    color:         '#000',
    padding:       '8px 20px',
    borderRadius:  4,
    fontSize:      13,
    fontWeight:    600,
    letterSpacing: '0.05em',
  },
  hero: {
    textAlign: 'center',
    padding:   '120px 24px 100px',
    maxWidth:  900,
    margin:    '0 auto',
  },
  eyebrow: {
    fontSize:      11,
    letterSpacing: '0.2em',
    opacity:       0.35,
    marginBottom:  24,
    textTransform: 'uppercase',
  },
  h1: {
    fontSize:      clamp(60, 88),
    fontWeight:    700,
    lineHeight:    1.0,
    letterSpacing: '-0.03em',
    marginBottom:  32,
  },
  sub: {
    fontSize:     18,
    opacity:      0.45,
    lineHeight:   1.7,
    marginBottom: 48,
  },
  heroCta: {
    background:    '#fff',
    color:         '#000',
    padding:       '14px 36px',
    borderRadius:  4,
    fontWeight:    700,
    fontSize:      14,
    letterSpacing: '0.06em',
    display:       'inline-block',
  },
  heroSecondary: {
    padding:       '14px 24px',
    opacity:       0.45,
    fontSize:      14,
    display:       'inline-block',
  },
  feature: {
    borderTop:  '1px solid rgba(255,255,255,0.06)',
    padding:    '72px 48px',
    maxWidth:   780,
    margin:     '0 auto',
  },
  tag: {
    display:       'block',
    fontSize:      10,
    letterSpacing: '0.2em',
    opacity:       0.3,
    marginBottom:  16,
    textTransform: 'uppercase',
  },
  h2: {
    fontSize:     28,
    fontWeight:   700,
    marginBottom: 16,
  },
  featureBody: {
    opacity:    0.45,
    lineHeight: 1.75,
    fontSize:   16,
  },
  ctaStrip: {
    textAlign:   'center',
    padding:     '100px 24px',
    borderTop:   '1px solid rgba(255,255,255,0.06)',
    background:  'rgba(255,255,255,0.02)',
  },
  footer: {
    textAlign:  'center',
    padding:    '32px 24px',
    fontSize:   12,
    opacity:    0.3,
    borderTop:  '1px solid rgba(255,255,255,0.06)',
  },
};

// Tiny helper so the H1 scales on small screens
function clamp(min, max) {
  return `clamp(${min}px, 10vw, ${max}px)`;
}
