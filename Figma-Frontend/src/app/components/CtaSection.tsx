import { motion } from 'motion/react'

interface CtaSectionProps {
  onUploadClick: () => void
}

export function CtaSection({ onUploadClick }: CtaSectionProps) {
  return (
    <section
      id="pricing"
      className="relative py-32 px-6 md:px-12 overflow-hidden"
      style={{ background: '#030310' }}
    >
      {/* Glow effects */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(162,155,254,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(255,107,157,0.06) 0%, rgba(78,205,196,0.04) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Prism icon */}
          <div className="flex justify-center mb-8">
            <div className="relative w-16 h-16">
              <div
                className="w-16 h-16 rounded-2xl"
                style={{
                  background:
                    'conic-gradient(from 0deg, #FF6B9D, #FF8C00, #F7DC6F, #4ECDC4, #45B7D1, #A29BFE, #FF6B9D)',
                  filter: 'blur(2px)',
                  opacity: 0.8,
                }}
              />
              <div
                className="absolute inset-2 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(3,3,16,0.85)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity="0.8"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h2
            className="mb-6"
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              color: 'white',
              lineHeight: 1.1,
            }}
          >
            Start splitting.
            <br />
            <span
              style={{
                background:
                  'linear-gradient(135deg, #FF6B9D 0%, #A29BFE 40%, #4ECDC4 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              No credit card required.
            </span>
          </h2>

          <p
            className="mb-10 max-w-lg mx-auto"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.7,
            }}
          >
            Upload your first track and experience professional-grade stem separation in minutes. Powered by Demucs, trusted by producers worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onUploadClick}
              className="group relative px-10 py-4 rounded-full text-white text-sm tracking-wide overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #A29BFE 0%, #FF6B9D 50%, #4ECDC4 100%)',
                backgroundSize: '200% 200%',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                boxShadow: '0 0 60px rgba(162, 155, 254, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
                fontSize: '0.95rem',
              }}
            >
              Split Your First Track Free
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {[
              '✓ 6 stems per track',
              '✓ WAV quality output',
              '✓ No watermarks',
              '✓ Instant download',
            ].map((text) => (
              <span
                key={text}
                className="px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
