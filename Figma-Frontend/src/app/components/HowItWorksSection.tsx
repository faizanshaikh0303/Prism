import { motion } from 'motion/react'

const steps = [
  {
    number: '01',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3v16M14 19L8 13M14 19L20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 22h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'Upload Your Track',
    description:
      'Drop in any audio file — MP3, WAV, FLAC, or AIFF. Up to 10 minutes, any quality. Our system handles the rest.',
    detail: 'Supports MP3 · WAV · FLAC · AIFF · OGG',
    color: '#FF6B9D',
  },
  {
    number: '02',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M9 14l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4v3M14 21v3M4 14h3M21 14h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: 'AI Separates Stems',
    description:
      'Demucs, Meta\'s state-of-the-art deep learning model, analyzes your track and surgically separates it into 6 pristine stems.',
    detail: 'Powered by Demucs 4.0 · ~2-5 min processing',
    color: '#A29BFE',
  },
  {
    number: '03',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="6" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12h2M9 16h2M13 12h6M13 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="22" cy="9" r="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21 9l1 1 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Download & Use',
    description:
      'Get all 6 stems as individual high-quality audio files. Mix, remix, sample, transcribe, or use them however you need.',
    detail: 'WAV · 44.1kHz · 16-bit · Lossless',
    color: '#4ECDC4',
  },
]

const features = [
  { icon: '⚡', label: 'Fast Processing', desc: 'Average 2-5 min per track' },
  { icon: '🎯', label: 'High Accuracy', desc: 'Industry-leading separation' },
  { icon: '🔒', label: 'Secure & Private', desc: 'Files auto-deleted after 24h' },
  { icon: '🎵', label: 'Any Genre', desc: 'Works on any musical style' },
]

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-32 px-6 md:px-12"
      style={{ background: '#030310' }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6"
            style={{
              background: 'rgba(78,205,196,0.08)',
              border: '1px solid rgba(78,205,196,0.2)',
              color: '#4ECDC4',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            How It Works
          </div>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            Three steps to
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #4ECDC4, #45B7D1, #A29BFE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              unlock every dimension.
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-16 left-0 right-0 h-px hidden lg:block"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(162,155,254,0.2) 20%, rgba(78,205,196,0.2) 50%, rgba(255,99,72,0.2) 80%, transparent)',
              marginLeft: '16.67%',
              marginRight: '16.67%',
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center lg:items-center"
              >
                {/* Number badge */}
                <div
                  className="relative z-10 mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `rgba(${hexToRgb(step.color)}, 0.08)`,
                    border: `1px solid rgba(${hexToRgb(step.color)}, 0.25)`,
                    color: step.color,
                    boxShadow: `0 0 30px rgba(${hexToRgb(step.color)}, 0.1)`,
                  }}
                >
                  {step.icon}
                </div>

                {/* Step number */}
                <div
                  className="text-xs tracking-widest mb-3"
                  style={{
                    color: step.color,
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    opacity: 0.7,
                  }}
                >
                  STEP {step.number}
                </div>

                {/* Title */}
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.3rem',
                    color: 'white',
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="mb-4 max-w-xs mx-auto"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.9rem',
                    color: 'rgba(255,255,255,0.45)',
                    lineHeight: 1.7,
                  }}
                >
                  {step.description}
                </p>

                {/* Detail pill */}
                <div
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    background: `rgba(${hexToRgb(step.color)}, 0.06)`,
                    border: `1px solid rgba(${hexToRgb(step.color)}, 0.15)`,
                    color: `rgba(${hexToRgb(step.color)}, 0.8)`,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {step.detail}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-5 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span className="text-2xl mb-2">{f.icon}</span>
              <span
                className="block mb-1"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '0.9rem',
                }}
              >
                {f.label}
              </span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.78rem',
                }}
              >
                {f.desc}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
