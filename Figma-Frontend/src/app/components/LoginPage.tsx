import { useState } from 'react'
import { useNavigate } from 'react-router'
import { prismApi } from '../api/prismApi'

export function LoginPage() {
  const navigate  = useNavigate()
  const [tab, setTab]           = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const fieldStyle = (id: string): React.CSSProperties => ({
    width:         '100%',
    background:    'transparent',
    border:        'none',
    borderBottom:  `1px solid ${focusedField === id ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}`,
    color:         '#fff',
    padding:       '0.75rem 0',
    fontSize:      '0.9rem',
    fontFamily:    "'Poppins', sans-serif",
    fontWeight:    300,
    outline:       'none',
    letterSpacing: '0.02em',
    transition:    'border-color 0.25s ease',
    boxSizing:     'border-box' as const,
  })

  const labelStyle: React.CSSProperties = {
    display:       'block',
    fontSize:      '0.62rem',
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color:         'rgba(255,255,255,0.38)',
    marginBottom:  '0.4rem',
    fontFamily:    "'Poppins', sans-serif",
    fontWeight:    300,
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      if (tab === 'signup') {
        await prismApi.register(email, password)
      } else {
        await prismApi.login(email, password)
      }
      navigate('/studio')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#000',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      fontFamily:     "'Poppins', sans-serif",
      fontWeight:     300,
      padding:        '2rem',
      position:       'relative',
      overflow:       'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position:     'absolute',
        width:        '700px',
        height:       '700px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(180,140,255,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>

        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          style={{
            background:    'none',
            border:        'none',
            color:         'rgba(255,255,255,0.35)',
            cursor:        'pointer',
            fontSize:      '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily:    "'Poppins', sans-serif",
            fontWeight:    300,
            marginBottom:  '3.5rem',
            padding:       0,
            display:       'flex',
            alignItems:    'center',
            gap:           '0.5rem',
          }}
        >
          ← Prism
        </button>

        <h1 style={{
          fontSize:      'clamp(1.8rem, 4vw, 2.6rem)',
          letterSpacing: '-0.01em',
          lineHeight:    1.1,
          color:         '#fff',
          marginBottom:  '0.6rem',
        }}>
          {tab === 'login' ? 'Welcome back.' : 'Create account.'}
        </h1>
        <p style={{
          fontSize:      '0.82rem',
          color:         'rgba(255,255,255,0.35)',
          letterSpacing: '0.02em',
          marginBottom:  '2.8rem',
        }}>
          {tab === 'login'
            ? 'Sign in to your Prism account.'
            : 'Start hearing music differently.'}
        </p>

        {/* Tab toggle */}
        <div style={{
          display:       'flex',
          gap:           '2rem',
          marginBottom:  '2.8rem',
          borderBottom:  '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                background:   'none',
                border:       'none',
                borderBottom: tab === t ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
                color:        tab === t ? '#fff' : 'rgba(255,255,255,0.28)',
                cursor:       'pointer',
                fontSize:     '0.72rem',
                letterSpacing:'0.18em',
                textTransform:'uppercase',
                fontFamily:   "'Poppins', sans-serif",
                fontWeight:   300,
                padding:      '0 0 0.85rem',
                marginBottom: '-1px',
                transition:   'color 0.25s ease, border-color 0.25s ease',
              }}
            >
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <label style={{ display: 'block' }}>
            <span style={labelStyle}>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('email')}
              autoComplete="email"
            />
          </label>

          <label style={{ display: 'block' }}>
            <span style={labelStyle}>Password</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={fieldStyle('password')}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {error && (
            <p style={{ fontSize: '0.78rem', color: '#ff6b6b', letterSpacing: '0.02em', marginTop: '-0.8rem' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:    '0.5rem',
              padding:      '1rem',
              background:   loading ? 'rgba(255,255,255,0.6)' : '#fff',
              color:        '#000',
              border:       'none',
              borderRadius: '100px',
              cursor:       loading ? 'not-allowed' : 'pointer',
              fontSize:     '0.78rem',
              letterSpacing:'0.16em',
              textTransform:'uppercase',
              fontFamily:   "'Poppins', sans-serif",
              fontWeight:   300,
              transition:   'opacity 0.2s ease',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError('') }}
              style={{
                background:     'none', border: 'none',
                color:          'rgba(255,255,255,0.55)',
                cursor:         'pointer',
                fontFamily:     "'Poppins', sans-serif",
                fontWeight:     300,
                fontSize:       '0.68rem',
                letterSpacing:  '0.06em',
                padding:        0,
                textDecoration: 'underline',
              }}
            >
              {tab === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
