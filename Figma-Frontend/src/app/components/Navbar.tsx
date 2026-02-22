import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'

interface NavbarProps {
  onUploadClick?: () => void
}

export function Navbar({ onUploadClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Features',    href: '#features' },
    { label: 'How It Works',href: '#how-it-works' },
    { label: 'Stems',       href: '#stems' },
  ]

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-500"
      style={{
        background:     scrolled ? 'rgba(3, 3, 16, 0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom:   scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      }}
    >
      {/* Logo */}
      <a href="#" className="flex items-center gap-2 group">
        <div className="relative w-8 h-8">
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #FF6B9D, #FF8C00, #F7DC6F, #4ECDC4, #45B7D1, #A29BFE, #FF6B9D)',
              filter: 'blur(1px)',
            }}
          />
          <div
            className="absolute inset-1 rounded-full"
            style={{ background: 'rgba(3,3,16,0.6)', backdropFilter: 'blur(4px)' }}
          />
        </div>
        <span
          className="tracking-widest text-white"
          style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.2em' }}
        >
          PRISM
        </span>
      </a>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-white/60 hover:text-white transition-colors duration-200 text-sm tracking-wide"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="hidden md:flex items-center gap-4">
        <button
          onClick={() => navigate('/login')}
          className="text-white/70 hover:text-white text-sm transition-colors duration-200"
          style={{ fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Sign In
        </button>
        <button
          onClick={() => navigate('/login')}
          className="relative px-5 py-2 text-sm text-white rounded-full overflow-hidden group transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #A29BFE, #FF6B9D)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span className="relative z-10">Try Free</span>
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #FF6B9D, #A29BFE)' }}
          />
        </button>
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span
          className="block w-5 h-0.5 bg-white transition-all duration-300"
          style={{ transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }}
        />
        <span
          className="block w-5 h-0.5 bg-white transition-all duration-300"
          style={{ opacity: menuOpen ? 0 : 1 }}
        />
        <span
          className="block w-5 h-0.5 bg-white transition-all duration-300"
          style={{ transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }}
        />
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 p-6 flex flex-col gap-4"
          style={{
            background:     'rgba(3,3,16,0.96)',
            backdropFilter: 'blur(20px)',
            borderBottom:   '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/70 hover:text-white text-base py-1"
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              className="flex-1 py-2 text-white/70 text-sm"
              onClick={() => { setMenuOpen(false); navigate('/login') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate('/login') }}
              className="flex-1 py-2 text-sm text-white rounded-full"
              style={{ background: 'linear-gradient(135deg, #A29BFE, #FF6B9D)', fontFamily: 'Inter, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              Try Free
            </button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
