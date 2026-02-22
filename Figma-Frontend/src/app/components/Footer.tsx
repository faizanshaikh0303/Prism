import { motion } from 'motion/react'

const links = {
  Product: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  Developers: ['API Docs', 'FastAPI Backend', 'GitHub', 'Status'],
  Company: ['About', 'Blog', 'Careers', 'Contact'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

export function Footer() {
  return (
    <footer
      className="relative pt-20 pb-10 px-6 md:px-12"
      style={{
        background: 'linear-gradient(to bottom, #030310, #010108)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, #FF6B9D, #FF8C00, #F7DC6F, #4ECDC4, #45B7D1, #A29BFE, #FF6B9D)',
                    filter: 'blur(1px)',
                  }}
                />
                <div
                  className="absolute inset-1 rounded-full"
                  style={{ background: 'rgba(1,1,8,0.7)', backdropFilter: 'blur(4px)' }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: 'white',
                  letterSpacing: '0.2em',
                }}
              >
                PRISM
              </span>
            </div>
            <p
              className="mb-6 max-w-xs"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.3)',
                lineHeight: 1.7,
              }}
            >
              Professional AI-powered stem separation. Split any song into 6 isolated tracks instantly.
            </p>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.05em',
              }}
            >
              Powered by Meta's Demucs 4.0
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4
                className="mb-4"
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  color: 'white',
                  fontSize: '0.8rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  opacity: 0.5,
                }}
              >
                {category}
              </h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.35)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')}
                      onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)')}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            © 2026 Prism. All rights reserved.
          </p>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.15)',
            }}
          >
            The same song. A whole new dimension.
          </p>
        </div>
      </div>
    </footer>
  )
}
