/**
 * HowItWorks — CodeCompass
 * Sticky left intro + numbered vertical step list with gradient connector line.
 */
const steps = [
  {
    number: '01',
    title: 'Paste a GitHub Repository URL',
    desc: "Enter any public GitHub repository URL into the input field. That's it — no account needed, no OAuth dance, no configuration required.",
    tag: '< 5 seconds',
  },
  {
    number: '02',
    title: 'CodeCompass Reads the Repository',
    desc: 'We fetch the full directory tree and identify key files: entry points, configuration files, dependency manifests, and source modules that define the architecture.',
    tag: 'Automated',
  },
  {
    number: '03',
    title: 'AI Generates an Onboarding Document',
    desc: 'Gemini 2.5 Flash synthesizes all fetched context into a comprehensive, structured onboarding guide — project overview, tech stack, setup steps, architecture, and more.',
    tag: 'Powered by Gemini',
  },
  {
    number: '04',
    title: 'Review the Documentation',
    desc: 'Read a clean, structured document in the left panel. Formatted with Markdown for clear headings, code blocks, and bullet lists. Drag the splitter to resize panels.',
    tag: 'Instant',
  },
  {
    number: '05',
    title: 'Chat with the AI Assistant',
    desc: 'Ask specific questions: "How does authentication work?", "What does the api/ folder do?", "Where is the database configuration?" — and get precise, grounded answers.',
    tag: 'Interactive',
  },
]

export default function HowItWorks() {
  return (
    <section className="section how-it-works" id="how-it-works" aria-labelledby="hiw-heading">
      <div className="section-inner">
        <div className="hiw-layout">

          {/* Sticky intro */}
          <div className="hiw-intro">
            <div className="section-label" aria-hidden="true">How It Works</div>
            <h2 className="section-heading" id="hiw-heading">
              From URL to insights<br /><span>in seconds</span>
            </h2>
            <p className="section-subheading">
              A simple, powerful five-step workflow designed for developers who value clarity and speed.
            </p>
          </div>

          {/* Numbered steps */}
          <div className="steps-container" role="list" aria-label="Step-by-step process">
            {steps.map((step, i) => (
              <div className="step" key={i} role="listitem">
                <div className="step-number" aria-label={`Step ${i + 1}`}>{step.number}</div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                  <div className="step-tag">{step.tag}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
