/**
 * Navbar — CodeCompass
 * Sticky glassmorphism navigation with theme toggle, smooth scroll links,
 * mobile hamburger, and compact variant for the result view.
 */
import { useState } from 'react'

/* ── Inline SVG icons ──────────────────────────────────────── */
const CompassSVG = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.12"/>
    <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M16 9v2M16 21v2M9 16h2M21 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19.5 12.5L17 17L12.5 19.5L15 15L19.5 12.5Z" fill="currentColor"/>
  </svg>
)

const SunSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
)

const MoonSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const MenuSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const XSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

/* ── Component ─────────────────────────────────────────────── */
export default function Navbar({ theme, onToggleTheme, variant = 'landing', onBack, repoId }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <>
      <nav className={`navbar${variant === 'compact' ? ' navbar-compact' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">

          {/* Logo */}
          <a
            href="#"
            className="navbar-logo"
            onClick={(e) => { e.preventDefault(); variant === 'compact' ? onBack?.() : scrollTo('hero') }}
            aria-label="CodeCompass — home"
          >
            <div style={{ color: 'var(--color-primary)' }}>
              <CompassSVG />
            </div>
            <span className="navbar-logo-text">Code<span>Compass</span></span>
          </a>

          {/* Desktop navigation (landing only) */}
          {variant === 'landing' && (
            <ul className="navbar-links" role="list">
              <li><a href="#about"        onClick={(e) => { e.preventDefault(); scrollTo('about') }}>About</a></li>
              <li><a href="#features"     onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a></li>
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a></li>
            </ul>
          )}

          {/* Compact centre — repo pill */}
          {variant === 'compact' && repoId && (
            <div className="navbar-repo-pill" title={repoId}>
              <span aria-hidden="true">📁</span>
              <span>{repoId}</span>
            </div>
          )}

          {/* Actions */}
          <div className="navbar-actions">
            {variant === 'compact' && (
              <button className="btn-ghost" onClick={onBack} aria-label="Go back to dashboard">
                ← Dashboard
              </button>
            )}

            <button
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <SunSVG /> : <MoonSVG />}
            </button>

            {variant === 'landing' && (
              <button
                className="btn-primary nav-cta"
                onClick={() => scrollTo('hero')}
                aria-label="Start analyzing a repository"
              >
                Get Started
              </button>
            )}

            {variant === 'landing' && (
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(o => !o)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <XSvg /> : <MenuSVG />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile dropdown nav */}
      {variant === 'landing' && (
        <div className={`mobile-nav${mobileOpen ? ' open' : ''}`} aria-hidden={!mobileOpen}>
          <a href="#about"        onClick={(e) => { e.preventDefault(); scrollTo('about') }}>About</a>
          <a href="#features"     onClick={(e) => { e.preventDefault(); scrollTo('features') }}>Features</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollTo('how-it-works') }}>How It Works</a>
        </div>
      )}
    </>
  )
}
