/**
 * CTASection — CodeCompass
 * Full-width Forest Green gradient banner with a single CTA
 * that scrolls to the hero input and focuses it.
 */
const ArrowSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

export default function CTASection() {
  const handleCTA = () => {
    const hero = document.getElementById('hero')
    const input = document.getElementById('hero-input')
    hero?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => input?.focus(), 500)
  }

  return (
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className="cta-card">
        <div className="cta-card-inner">
          <h2 className="cta-title" id="cta-heading">
            Ready to navigate<br />your next codebase?
          </h2>
          <p className="cta-subtitle">
            Join developers who use CodeCompass to onboard faster, understand more,
            and ship code with confidence.
          </p>
          <button className="cta-btn" onClick={handleCTA} aria-label="Start analyzing — it's free">
            Start Analyzing — It&apos;s Free
            <ArrowSVG />
          </button>
        </div>
      </div>
    </section>
  )
}
