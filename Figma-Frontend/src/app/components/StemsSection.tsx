import { motion } from 'motion/react'

const stems = [
  {
    id: 'vocals',
    name: 'Vocals',
    icon: '🎤',
    color: '#FF6B9D',
    gradient: 'linear-gradient(135deg, rgba(255,107,157,0.15), rgba(255,107,157,0.03))',
    border: 'rgba(255,107,157,0.25)',
    glow: 'rgba(255,107,157,0.15)',
    description:
      'Isolate lead and backing vocals with crystal-clear separation. Perfect for karaoke, remixes, and vocal analysis.',
    tags: ['Lead Vocals', 'Harmonies', 'Ad-libs'],
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: '🎸',
    color: '#4ECDC4',
    gradient: 'linear-gradient(135deg, rgba(78,205,196,0.15), rgba(78,205,196,0.03))',
    border: 'rgba(78,205,196,0.25)',
    glow: 'rgba(78,205,196,0.15)',
    description:
      'Extract deep bass lines, sub-bass frequencies, and bass guitar tracks for unparalleled low-end clarity.',
    tags: ['Bass Guitar', 'Sub-Bass', 'Basslines'],
  },
  {
    id: 'guitar',
    name: 'Guitar',
    icon: '🎵',
    color: '#45B7D1',
    gradient: 'linear-gradient(135deg, rgba(69,183,209,0.15), rgba(69,183,209,0.03))',
    border: 'rgba(69,183,209,0.25)',
    glow: 'rgba(69,183,209,0.15)',
    description:
      'Separate acoustic and electric guitar tracks from any mix. Learn riffs, create covers, or repurpose stems.',
    tags: ['Electric', 'Acoustic', 'Riffs'],
  },
  {
    id: 'piano',
    name: 'Piano',
    icon: '🎹',
    color: '#F7DC6F',
    gradient: 'linear-gradient(135deg, rgba(247,220,111,0.15), rgba(247,220,111,0.03))',
    border: 'rgba(247,220,111,0.25)',
    glow: 'rgba(247,220,111,0.15)',
    description:
      'Isolate piano, keyboards, and synthesizer parts. Transcribe chords, learn melodies, or build new arrangements.',
    tags: ['Piano', 'Synths', 'Keys'],
  },
  {
    id: 'drums',
    name: 'Drums',
    icon: '🥁',
    color: '#FF6348',
    gradient: 'linear-gradient(135deg, rgba(255,99,72,0.15), rgba(255,99,72,0.03))',
    border: 'rgba(255,99,72,0.25)',
    glow: 'rgba(255,99,72,0.15)',
    description:
      'Extract the complete drum kit — kick, snare, hi-hats, cymbals, and percussion with surgical precision.',
    tags: ['Kick & Snare', 'Hi-Hats', 'Percussion'],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '🎶',
    color: '#A29BFE',
    gradient: 'linear-gradient(135deg, rgba(162,155,254,0.15), rgba(162,155,254,0.03))',
    border: 'rgba(162,155,254,0.25)',
    glow: 'rgba(162,155,254,0.15)',
    description:
      'Everything else — strings, brass, woodwinds, ambient textures, and any remaining instruments captured cleanly.',
    tags: ['Strings', 'Brass', 'Textures'],
  },
]

export function StemsSection() {
  return (
    <section
      id="stems"
      className="relative py-32 px-6 md:px-12"
      style={{
        background: 'linear-gradient(to bottom, #030310, #060318, #030310)',
      }}
    >
      {/* Section header */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div
            className="inline-block px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6"
            style={{
              background: 'rgba(162,155,254,0.08)',
              border: '1px solid rgba(162,155,254,0.2)',
              color: '#A29BFE',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            6 Stems · 6 Dimensions
          </div>
          <h2
            className="mb-4"
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            Every layer of your music,
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, #FF6B9D, #A29BFE, #4ECDC4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              precisely isolated.
            </span>
          </h2>
          <p
            className="max-w-xl mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '1rem',
              lineHeight: 1.7,
            }}
          >
            Powered by Meta's Demucs AI — the same engine trusted by professional music producers worldwide.
          </p>
        </motion.div>

        {/* Stem cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stems.map((stem, i) => (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative rounded-2xl p-6 cursor-default"
              style={{
                background: stem.gradient,
                border: `1px solid ${stem.border}`,
                boxShadow: `0 0 0 0 ${stem.glow}`,
                transition: 'box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px 4px ${stem.glow}`
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 ${stem.glow}`
              }}
            >
              {/* Color accent top bar */}
              <div
                className="absolute top-0 left-6 right-6 h-px rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${stem.color}, transparent)`,
                  opacity: 0.5,
                }}
              />

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: `rgba(${hexToRgb(stem.color)}, 0.12)`,
                    border: `1px solid rgba(${hexToRgb(stem.color)}, 0.25)`,
                  }}
                >
                  {stem.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      color: 'white',
                    }}
                  >
                    {stem.name}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p
                className="mb-4 leading-relaxed"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: 1.65,
                }}
              >
                {stem.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {stem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full text-xs"
                    style={{
                      background: `rgba(${hexToRgb(stem.color)}, 0.08)`,
                      color: stem.color,
                      border: `1px solid rgba(${hexToRgb(stem.color)}, 0.2)`,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Download button (hidden until upload) */}
              <div
                className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: `rgba(${hexToRgb(stem.color)}, 0.2)` }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 1v7M6 8L3 5M6 8L9 5M1 11h10"
                      stroke={stem.color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
