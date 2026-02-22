import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { PrismCanvas, STEMS, LINEUP_POSITIONS } from './PrismCanvas'

// ── Camera constants (must match PrismCanvas) ─────────────────────────────────
const CAM_FOV = 48
const CAM_Z   = 4.5

function project(x: number, y: number, z: number, W: number, H: number) {
  const dist  = CAM_Z - z
  const halfH = Math.tan((CAM_FOV / 2) * (Math.PI / 180)) * dist
  const halfW = halfH * (W / H)
  return {
    sx: ( x / halfW * 0.5 + 0.5) * W,
    sy: (-y / halfH * 0.5 + 0.5) * H,
  }
}

function shapeRadiusPx(H: number): number {
  const dist  = CAM_Z - 0.30
  const halfH = Math.tan((CAM_FOV / 2) * (Math.PI / 180)) * dist
  return (0.52 * 0.64 / halfH) * (H / 2)
}

// ── Spatial diagram data ──────────────────────────────────────────────────────
// Each stem gets a position in the spatial circle (angle in degrees, radius 0–1)
const DIAGRAM_STEMS = STEMS.map((stem, i) => {
  const angleDeg = [72, 195, 138, 22, 258, 315][i]
  const normR    = [0.80, 0.96, 0.60, 0.44, 0.84, 0.70][i]
  const rad = angleDeg * Math.PI / 180
  const maxR = 138
  return {
    ...stem,
    cx: 200 + maxR * normR * Math.cos(rad),
    cy: 200 - maxR * normR * Math.sin(rad), // SVG y is flipped
  }
})

// ── Spatial Diagram SVG ───────────────────────────────────────────────────────
function SpatialDiagram({ visible }: { visible: boolean }) {
  return (
    <>
      <style>{`
        @keyframes stemPing {
          0%   { transform: scale(1);   opacity: 0.55; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes youPulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
      `}</style>

      <svg
        viewBox="0 0 400 400"
        style={{
          width:   '100%',
          maxWidth: '380px',
          height:  'auto',
          opacity:   visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'opacity 1.1s ease 600ms, transform 1.1s ease 600ms',
        }}
      >
        {/* Rings */}
        <circle cx="200" cy="200" r="138" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        <circle cx="200" cy="200" r="92"  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 7"/>
        <circle cx="200" cy="200" r="46"  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>

        {/* Dashed lines from center to each stem */}
        {DIAGRAM_STEMS.map(stem => (
          <line
            key={`line-${stem.id}`}
            x1="200" y1="200"
            x2={stem.cx} y2={stem.cy}
            stroke={stem.color}
            strokeWidth="0.7"
            strokeDasharray="3 6"
            opacity="0.28"
          />
        ))}

        {/* Stem dots — ping rings + filled dot */}
        {DIAGRAM_STEMS.map((stem, i) => (
          <g key={stem.id}>
            {/* Ping ring */}
            <circle
              cx={stem.cx} cy={stem.cy} r="7"
              fill="none"
              stroke={stem.color}
              strokeWidth="1"
              style={{
                transformOrigin: `${stem.cx}px ${stem.cy}px`,
                animation: `stemPing ${2.6 + i * 0.22}s ease-out ${i * 0.38}s infinite`,
                opacity: visible ? 1 : 0,
              }}
            />
            {/* Filled dot */}
            <circle
              cx={stem.cx} cy={stem.cy} r="5.5"
              fill={stem.color}
              opacity="0.92"
            />
            {/* Label */}
            <text
              x={stem.cx + (stem.cx > 200 ? 11 : -11)}
              y={stem.cy + 4}
              fill={stem.color}
              fontSize="9.5"
              fontFamily="'Poppins', sans-serif"
              fontWeight="300"
              letterSpacing="1.5"
              textAnchor={stem.cx > 200 ? 'start' : 'end'}
              opacity="0.85"
            >
              {stem.name.toUpperCase()}
            </text>
          </g>
        ))}

        {/* YOU — center marker */}
        <circle cx="200" cy="200" r="10" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1"/>
        <circle cx="200" cy="200" r="3"  fill="rgba(255,255,255,0.9)"
          style={{ animation: 'youPulse 2.8s ease-in-out infinite' }}
        />
        <text
          x="200" y="220"
          fill="rgba(255,255,255,0.38)"
          fontSize="8"
          fontFamily="'Poppins', sans-serif"
          fontWeight="300"
          letterSpacing="3"
          textAnchor="middle"
        >
          YOU
        </text>
      </svg>
    </>
  )
}

// ── Spatial Audio Explainer Section ──────────────────────────────────────────
function SpatialSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fade = (delay = 0): React.CSSProperties => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.9s ease ${delay}ms, transform 0.9s ease ${delay}ms`,
  })

  const steps = [
    {
      num:   '01',
      title: 'Pick a song',
      desc:  'Choose from our pre-stemmed demo library, or upload your own track. Prism separates it into six clean stems automatically.',
    },
    {
      num:   '02',
      title: 'Place in space',
      desc:  'You are at the center. Drag each stem to any angle and distance around you — like positioning musicians on a stage.',
    },
    {
      num:   '03',
      title: 'Feel the sound',
      desc:  'Spatial audio renders in real-time. Every stem sounds like it\'s coming from exactly where you placed it.',
    },
  ]

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight:   '100vh',
        background:  '#000',
        color:       '#fff',
        fontFamily:  "'Poppins', sans-serif",
        fontWeight:  300,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        padding:     'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '1000px' }}>

        {/* Header */}
        <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
          <p style={{
            ...fade(0),
            letterSpacing: '0.28em',
            fontSize:      '0.78rem',
            color:         'rgba(255,255,255,0.75)',
            textTransform: 'uppercase',
            marginBottom:  '1.2rem',
          }}>
            How it works
          </p>
          <h2 style={{
            ...fade(120),
            fontSize:      'clamp(2rem, 4.5vw, 3rem)',
            letterSpacing: '-0.01em',
            lineHeight:    1.12,
            color:         '#fff',
            maxWidth:      '520px',
          }}>
            Six stems.<br />
            <span style={{ color: 'rgba(255,255,255,0.42)' }}>Positioned in space.</span>
          </h2>
        </div>

        {/* Two-column: steps + diagram */}
        <div style={{
          display:   'flex',
          flexWrap:  'wrap',
          gap:       'clamp(3rem, 6vw, 5rem)',
          alignItems: 'center',
        }}>

          {/* Steps */}
          <div style={{
            flex:     '1 1 300px',
            display:  'flex',
            flexDirection: 'column',
            gap:      '2.8rem',
          }}>
            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  ...fade(280 + i * 180),
                  display:   'flex',
                  gap:       '1.5rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Step number */}
                <span style={{
                  fontSize:      '0.95rem',
                  letterSpacing: '0.08em',
                  color:         'rgba(255,255,255,0.55)',
                  paddingTop:    '0.22rem',
                  flexShrink:    0,
                  minWidth:      '2.4rem',
                }}>
                  {step.num}
                </span>

                <div>
                  <p style={{
                    fontSize:      '1.05rem',
                    letterSpacing: '0.01em',
                    color:         '#fff',
                    marginBottom:  '0.55rem',
                  }}>
                    {step.title}
                  </p>
                  <p style={{
                    fontSize:      '0.84rem',
                    letterSpacing: '0.01em',
                    lineHeight:    1.75,
                    color:         'rgba(255,255,255,0.52)',
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Stem chips */}
            <div style={{
              ...fade(920),
              display:  'flex',
              flexWrap: 'wrap',
              gap:      '0.5rem',
              marginTop: '0.4rem',
            }}>
              {STEMS.map(stem => (
                <span
                  key={stem.id}
                  style={{
                    fontSize:      '0.65rem',
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase' as const,
                    color:         stem.color,
                    border:        `1px solid ${stem.color}45`,
                    borderRadius:  '100px',
                    padding:       '0.28rem 0.85rem',
                    background:    `${stem.color}0d`,
                  }}
                >
                  {stem.name}
                </span>
              ))}
            </div>
          </div>

          {/* Spatial diagram */}
          <div style={{
            flex:           '1 1 300px',
            display:        'flex',
            justifyContent: 'center',
            alignItems:     'center',
          }}>
            <SpatialDiagram visible={visible} />
          </div>

        </div>
      </div>
    </section>
  )
}

// ── CTA Section ──────────────────────────────────────────────────────────────
function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fade = (delay = 0): React.CSSProperties => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 1s ease ${delay}ms, transform 1s ease ${delay}ms`,
  })

  return (
    <section
      ref={sectionRef}
      style={{
        minHeight:      '100vh',
        background:     '#000',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 6vw, 5rem)',
        fontFamily:     "'Poppins', sans-serif",
        fontWeight:     300,
        textAlign:      'center',
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      {/* Ambient glow behind the headline */}
      <div style={{
        position:     'absolute',
        width:        '600px',
        height:       '600px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(180,140,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
        top:          '50%',
        left:         '50%',
        transform:    'translate(-50%, -50%)',
      }} />

      <div style={{ position: 'relative', maxWidth: '580px' }}>

        {/* Eyebrow */}
        <p style={{
          ...fade(0),
          letterSpacing: '0.38em',
          fontSize:      '0.72rem',
          color:         'rgba(255,255,255,0.5)',
          textTransform: 'uppercase',
          marginBottom:  '2rem',
        }}>
          Try it now
        </p>

        {/* Headline */}
        <h2 style={{
          ...fade(160),
          fontSize:   'clamp(2.4rem, 5vw, 3.6rem)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          color:      '#fff',
          marginBottom: '1.4rem',
        }}>
          Hear music<br />
          <span style={{ color: 'rgba(255,255,255,0.38)' }}>differently.</span>
        </h2>

        {/* Sub */}
        <p style={{
          ...fade(300),
          fontSize:      '0.9rem',
          letterSpacing: '0.02em',
          lineHeight:    1.8,
          color:         'rgba(255,255,255,0.45)',
          marginBottom:  '3.2rem',
        }}>
          Step inside a song. Position its layers around you.<br />
          Feel sound the way it was never meant to be heard.
        </p>

        {/* CTA Button */}
        <div style={{ ...fade(460) }}>
          <button
            onClick={() => navigate('/login')}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '0.75rem',
              padding:        '1rem 2.6rem',
              background:     hovered ? '#fff' : 'transparent',
              color:          hovered ? '#000' : '#fff',
              border:         '1px solid rgba(255,255,255,0.55)',
              borderRadius:   '100px',
              cursor:         'pointer',
              fontSize:       '0.82rem',
              letterSpacing:  '0.14em',
              textTransform:  'uppercase' as const,
              transition:     'background 0.3s ease, color 0.3s ease, border-color 0.3s ease',
              fontFamily:     "'Poppins', sans-serif",
              fontWeight:     300,
            }}
          >
            Get Started
            <span style={{
              display:    'inline-block',
              transform:  hovered ? 'translateX(3px)' : 'translateX(0)',
              transition: 'transform 0.3s ease',
            }}>
              →
            </span>
          </button>
        </div>

      </div>
    </section>
  )
}

// ── Main HeroSection ─────────────────────────────────────────────────────────

interface HeroSectionProps {
  onUploadClick: () => void
}

export function HeroSection({ onUploadClick }: HeroSectionProps) {
  const [isHovered,      setIsHovered]      = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [canvasSize,     setCanvasSize]     = useState({ w: window.innerWidth, h: window.innerHeight })

  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = wrapperRef.current
      if (!el) return
      const zone = el.offsetHeight - window.innerHeight
      if (zone <= 0) return
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / zone)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => setCanvasSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const lineupPhase = Math.max(0, Math.min(1, (scrollProgress - 0.38) / 0.34))
  const labelPhase  = Math.max(0, Math.min(1, (scrollProgress - 0.72) / 0.28))

  const gray     = Math.round(255 * (1 - lineupPhase))
  const stickyBg = `rgb(${gray},${gray},${gray})`

  const { w: W, h: H } = canvasSize
  const radius = shapeRadiusPx(H)

  return (
    <>
      <div ref={wrapperRef} style={{ height: '300vh', position: 'relative' }}>
        <div style={{
          position:   'sticky',
          top:        0,
          height:     '100vh',
          overflow:   'hidden',
          background: stickyBg,
        }}>
          <PrismCanvas
            isHovered={isHovered}
            scrollProgress={scrollProgress}
            onHoverChange={setIsHovered}
          />

          {STEMS.map((stem, i) => {
            const [lx, ly, lz] = LINEUP_POSITIONS[i]
            const { sx, sy }   = project(lx, ly, lz, W, H)
            const stagger      = i * 0.12
            const stemPhase    = Math.max(0, Math.min(1, (labelPhase - stagger) / (1 - stagger + 0.001)))

            return (
              <div
                key={stem.id}
                style={{
                  position:      'absolute',
                  left:          sx,
                  top:           sy + radius + 16,
                  transform:     `translateX(-50%) translateY(${(1 - stemPhase) * 14}px)`,
                  opacity:       stemPhase,
                  pointerEvents: 'none',
                  whiteSpace:    'nowrap',
                  fontFamily:    "'Poppins', sans-serif",
                  fontWeight:    300,
                  fontSize:      '0.60rem',
                  letterSpacing: '0.26em',
                  textTransform: 'uppercase' as const,
                  color:         stem.color,
                }}
              >
                {stem.name}
              </div>
            )
          })}
        </div>
      </div>

      <SpatialSection />
      <CtaSection />
    </>
  )
}