/**
 * HeroSection — CodeCompass
 * Full-viewport hero with animated gradient blobs, URL input,
 * stats row, and trust badges. Preserves the analyze functionality.
 */
const SearchSVG = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const AlertSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <circle cx="12" cy="16" r="0.5" fill="currentColor"/>
  </svg>
)

export default function HeroSection({ githubUrl, setGithubUrl, onAnalyze, isLoading, error }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading && githubUrl.trim()) {
      onAnalyze(githubUrl)
    }
  }

  return (
    <section className="hero" id="hero" aria-label="Hero — analyze a GitHub repository">

      {/* Animated background */}
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-bg-grid" />
        <div className="hero-bg-blob hero-bg-blob-1" />
        <div className="hero-bg-blob hero-bg-blob-2" />
        <div className="hero-bg-blob hero-bg-blob-3" />
      </div>

      <div className="hero-content">
        {/* Badge */}
        <div className="hero-badge" role="status">
          <div className="hero-badge-dot" aria-hidden="true" />
          AI-Powered Developer Tool
        </div>

        {/* Headline */}
        <h1 className="hero-headline">
          Navigate Any Codebase<br />
          with <span className="hero-headline-highlight">AI Precision</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Paste any GitHub repository URL and get a comprehensive onboarding guide,
          architecture overview, and an AI assistant that knows your codebase inside and out — in under 60 seconds.
        </p>

        {/* URL input */}
        <div className="hero-input-card" role="search" aria-label="Repository URL input">
          <input
            id="hero-input"
            className="hero-input"
            type="url"
            placeholder="https://github.com/owner/repository"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
            aria-label="GitHub repository URL"
          />
          <button
            className="hero-analyze-btn"
            onClick={() => onAnalyze(githubUrl)}
            disabled={isLoading || !githubUrl.trim()}
            aria-label="Analyze repository"
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Analyzing...
              </>
            ) : (
              <>
                <SearchSVG />
                Analyze Repo
              </>
            )}
          </button>
        </div>

        {/* Error state */}
        {error && !isLoading && (
          <div className="hero-error" role="alert" aria-live="polite">
            <AlertSVG />
            {error}
          </div>
        )}

        {/* Loading hint */}
        {isLoading && (
          <div className="hero-loading-text" aria-live="polite">
            <span className="spinner spinner-green" aria-hidden="true" />
            Fetching repository and generating onboarding document…
          </div>
        )}

        {/* Stats */}
        {!isLoading && (
          <div className="hero-stats" aria-label="Key metrics">
            <div className="hero-stat">
              <span className="hero-stat-value">10×</span>
              <span className="hero-stat-label">Faster Onboarding</span>
            </div>
            <div className="hero-stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat-value">Any</span>
              <span className="hero-stat-label">GitHub Repository</span>
            </div>
            <div className="hero-stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <span className="hero-stat-value">&lt;60s</span>
              <span className="hero-stat-label">Analysis Time</span>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="hero-trust" aria-label="Feature highlights">
          <div className="hero-trust-badge"><span aria-hidden="true">⚡</span> Instant results</div>
          <div className="hero-trust-badge"><span aria-hidden="true">🔒</span> Private repos supported</div>
          <div className="hero-trust-badge"><span aria-hidden="true">🤖</span> Gemini 2.5 Flash</div>
        </div>
      </div>
    </section>
  )
}
