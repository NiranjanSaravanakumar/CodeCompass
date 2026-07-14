/**
 * AboutSection — CodeCompass
 * Two-column layout explaining what CodeCompass does, who it's for,
 * and key stats that make the value proposition credible.
 */
const aboutFeatures = [
  {
    icon: '🔍',
    title: 'Instant Code Understanding',
    desc: 'CodeCompass reads through your entire repository structure and extracts the key files that define your project — in seconds, not hours.',
  },
  {
    icon: '🗺️',
    title: 'Architecture Mapping',
    desc: 'Understand how services, modules, and layers connect to each other without spending days reading through scattered documentation.',
  },
  {
    icon: '💬',
    title: 'Contextual AI Chat',
    desc: 'Ask specific questions and get precise answers grounded in your actual codebase — not generic Stack Overflow advice.',
  },
]

const stats = [
  { num: '58%',   label: 'Of dev time spent reading, not writing code' },
  { num: '3–5',   label: 'Days avg. to understand a new codebase' },
  { num: '<60s',  label: 'With CodeCompass analysis time' },
  { num: '∞',     label: 'Questions you can ask about any repository' },
]

export default function AboutSection() {
  return (
    <section className="section about" id="about" aria-labelledby="about-heading">
      <div className="section-inner">
        <div className="about-grid">

          {/* Left — narrative + stats */}
          <div className="about-text">
            <div className="section-label" aria-hidden="true">About</div>

            <h2 className="section-heading" id="about-heading">
              Built for developers<br />who ship <span>fast</span>
            </h2>

            <p className="about-body">
              Joining a new team or contributing to an open-source project means spending days —
              sometimes weeks — just understanding the codebase before you can write a single meaningful
              line of code.
            </p>

            <p className="about-body">
              CodeCompass eliminates that ramp-up time. Connect any GitHub repository and instantly get
              a structured onboarding document with an interactive AI assistant that knows every file,
              every dependency, and every design decision in your codebase.
            </p>

            <div className="about-stats" role="list" aria-label="Key statistics">
              {stats.map((s, i) => (
                <div className="about-stat-card" key={i} role="listitem">
                  <div className="about-stat-num" aria-label={s.num}>{s.num}</div>
                  <div className="about-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — feature items */}
          <div className="about-right">
            {aboutFeatures.map((f, i) => (
              <div className="about-feature-item" key={i}>
                <div className="about-feature-icon" aria-hidden="true">{f.icon}</div>
                <div>
                  <div className="about-feature-title">{f.title}</div>
                  <div className="about-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
