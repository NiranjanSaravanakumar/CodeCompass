/**
 * FeaturesSection — CodeCompass
 * Premium feature cards with top-gradient hover effect.
 */
const features = [
  {
    icon: '📄',
    title: 'AI Onboarding Document',
    desc: 'Auto-generates a comprehensive onboarding guide covering project overview, tech stack, folder structure, key files, and step-by-step setup instructions.',
  },
  {
    icon: '💬',
    title: 'Contextual AI Chat',
    desc: 'Ask anything about the codebase and get precise, context-aware answers powered by Gemini 2.5 Flash — grounded in your actual files.',
  },
  {
    icon: '🐙',
    title: 'GitHub Integration',
    desc: 'Works seamlessly with any public GitHub repository. Simply paste the URL — no OAuth, no complex configuration, no account required.',
  },
  {
    icon: '🏗️',
    title: 'Architecture Overview',
    desc: 'Understand how services, modules, layers, and components interconnect at a glance with a clear architectural breakdown.',
  },
  {
    icon: '⚡',
    title: 'Under 60 Seconds',
    desc: 'No waiting. CodeCompass fetches your repository and generates a full onboarding document in well under a minute.',
  },
  {
    icon: '↔️',
    title: 'Resizable Split View',
    desc: 'Drag the splitter to customize your workspace ratio. More room for the documentation or more room for the chat — your call.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="section features" id="features" aria-labelledby="features-heading">
      <div className="section-inner">
        <div className="features-header">
          <div className="section-label" aria-hidden="true">Features</div>
          <h2 className="section-heading" id="features-heading">
            Everything you need to understand<br /><span>any codebase</span>
          </h2>
          <p className="section-subheading">
            CodeCompass combines repository analysis, AI-generated documentation, and interactive chat
            into one seamless developer workflow.
          </p>
        </div>

        <div className="features-grid" role="list" aria-label="Feature list">
          {features.map((f, i) => (
            <article className="feature-card" key={i} role="listitem">
              <div className="feature-card-icon" aria-hidden="true">{f.icon}</div>
              <h3 className="feature-card-title">{f.title}</h3>
              <p className="feature-card-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
