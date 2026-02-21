import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Auth() {
  const [params]  = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [formErr,  setFormErr]  = useState('');

  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();

  // Already logged in → go to studio
  useEffect(() => {
    if (!loading && user) navigate('/studio');
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErr('');

    if (!email || !password) { setFormErr('Please fill in all fields.'); return; }
    if (password.length < 6)  { setFormErr('Password must be at least 6 characters.'); return; }

    setBusy(true);
    try {
      if (mode === 'signup') {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/studio');
    } catch (err) {
      console.error('[Auth] full error:', err.code, err.message, err.response?.status, err.response?.data);
      const detail = err.response?.data?.detail;
      if (!err.response) {
        setFormErr(`Cannot reach server — ${err.code ?? err.message}`);
      } else if (Array.isArray(detail)) {
        // FastAPI/Pydantic validation error — detail is an array of objects
        setFormErr(detail.map((d) => d.msg ?? JSON.stringify(d)).join(' · '));
      } else if (typeof detail === 'string') {
        setFormErr(detail);
      } else {
        setFormErr(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Back link */}
      <Link to="/" style={styles.back}>← PRISM</Link>

      <div style={styles.card}>
        {/* Toggle */}
        <div style={styles.toggle}>
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setFormErr(''); }}
              style={{
                ...styles.toggleBtn,
                background: mode === m ? '#fff' : 'transparent',
                color:      mode === m ? '#000' : 'rgba(255,255,255,0.4)',
              }}
            >
              {m === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <h1 style={styles.h1}>
          {mode === 'login' ? 'Welcome back.' : 'Join Prism.'}
        </h1>
        <p style={styles.sub}>
          {mode === 'login'
            ? 'Sign in to access your spatial mixes.'
            : 'Free account · 3 song uploads · unlimited demos.'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              style={styles.input}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {formErr && <p style={styles.error}>{formErr}</p>}

          <button type="submit" disabled={busy} style={styles.submit}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight:      '100vh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexDirection:  'column',
    background:     '#0a0a0f',
    padding:        24,
    position:       'relative',
  },
  back: {
    position:      'absolute',
    top:           24,
    left:          32,
    fontSize:      12,
    letterSpacing: '0.1em',
    opacity:       0.35,
  },
  card: {
    width:     '100%',
    maxWidth:  420,
    padding:   40,
    border:    '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.02)',
  },
  toggle: {
    display:      'flex',
    background:   'rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding:      3,
    marginBottom: 32,
    gap:          3,
  },
  toggleBtn: {
    flex:         1,
    padding:      '8px 0',
    borderRadius: 4,
    border:       'none',
    fontSize:     12,
    fontFamily:   'inherit',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'all 0.2s',
    letterSpacing: '0.04em',
  },
  h1: {
    fontSize:     28,
    fontWeight:   700,
    marginBottom: 8,
    letterSpacing: '-0.01em',
  },
  sub: {
    opacity:      0.4,
    fontSize:     13,
    lineHeight:   1.6,
    marginBottom: 32,
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           18,
  },
  label: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
    fontSize:      12,
    letterSpacing: '0.06em',
    opacity:       0.7,
  },
  input: {
    background:   'rgba(255,255,255,0.05)',
    border:       '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding:      '12px 14px',
    color:        '#fff',
    fontSize:     14,
    fontFamily:   'inherit',
    outline:      'none',
    transition:   'border-color 0.15s',
  },
  error: {
    color:    '#FF6B6B',
    fontSize: 12,
    padding:  '8px 12px',
    background: 'rgba(255,107,107,0.1)',
    borderRadius: 4,
    border:   '1px solid rgba(255,107,107,0.3)',
  },
  submit: {
    background:    '#fff',
    color:         '#000',
    border:        'none',
    borderRadius:  6,
    padding:       '13px',
    fontWeight:    700,
    fontSize:      14,
    fontFamily:    'inherit',
    letterSpacing: '0.06em',
    cursor:        'pointer',
    marginTop:     4,
    transition:    'opacity 0.15s',
  },
};
