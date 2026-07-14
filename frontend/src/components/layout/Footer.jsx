/**
 * Footer — CodeCompass
 * Multi-column professional footer with brand, product links, and tech credits.
 */
const CompassSVG = () => (
  <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M16 9v2M16 21v2M9 16h2M21 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M19.5 12.5L17 17L12.5 19.5L15 15L19.5 12.5Z" fill="currentColor"/>
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer-inner">
        {/* Brand column */}
        <div className="footer-brand">
          <a href="#" className="footer-logo" style={{ color: 'var(--color-primary)', gap: '8px' }}>
            <CompassSVG />
            <span style={{ color: 'var(--text-primary)' }}>CodeCompass</span>
          </a>
          <p className="footer-brand-desc">
            Navigate any codebase with AI precision. Built for developers who value their time and ship with confidence.
          </p>
        </div>

        {/* Product links */}
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links">
            <li><a href="#features"     onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a></li>
            <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }) }}>How It Works</a></li>
            <li><a href="#about"        onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>About</a></li>
          </ul>
        </div>

        {/* Technology links */}
        <div>
          <div className="footer-col-title">Technology</div>
          <ul className="footer-links">
            <li><a href="https://ai.google.dev/"        target="_blank" rel="noopener noreferrer">Gemini AI</a></li>
            <li><a href="https://github.com/"           target="_blank" rel="noopener noreferrer">GitHub API</a></li>
            <li><a href="https://fastapi.tiangolo.com/" target="_blank" rel="noopener noreferrer">FastAPI</a></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <div className="footer-col-title">Resources</div>
          <ul className="footer-links">
            <li><a href="https://docs.github.com/en/rest" target="_blank" rel="noopener noreferrer">GitHub REST API</a></li>
            <li><a href="https://vitejs.dev/"             target="_blank" rel="noopener noreferrer">Vite</a></li>
            <li><a href="https://react.dev/"              target="_blank" rel="noopener noreferrer">React</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {year} CodeCompass. Built with ❤️ for developers everywhere.
        </p>
        <p className="footer-powered">
          Powered by Gemini 2.5 Flash &amp; GitHub API
        </p>
      </div>
    </footer>
  )
}
