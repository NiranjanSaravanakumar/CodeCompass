/**
 * App — CodeCompass root
 *
 * Manages application state via a phase machine:
 *   'landing'  → shows the full landing page (Hero + sections + Footer)
 *   'loading'  → landing page with analyze-in-progress state
 *   'result'   → compact nav + split-pane (DocPanel | Splitter | ChatPanel)
 *
 * All analysis and chat logic lives here and is passed to children as props
 * so individual components stay stateless and easily testable.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

import { useTheme } from './hooks/useTheme'

import Navbar          from './components/layout/Navbar'
import Footer          from './components/layout/Footer'
import HeroSection     from './components/landing/HeroSection'
import AboutSection    from './components/landing/AboutSection'
import FeaturesSection from './components/landing/FeaturesSection'
import HowItWorks      from './components/landing/HowItWorks'
import CTASection      from './components/landing/CTASection'
import DocPanel        from './components/app/DocPanel'
import ChatPanel       from './components/app/ChatPanel'
import Splitter        from './components/app/Splitter'

import './App.css'

/* ── Constants ────────────────────────────────────────────── */
const API_BASE      = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const MIN_DOC_WIDTH  = 280   // px
const MIN_CHAT_WIDTH = 260   // px

/* ── Root component ───────────────────────────────────────── */
function App() {
  const { theme, toggleTheme } = useTheme()

  /* Phase state machine */
  const [phase, setPhase] = useState('landing')   // 'landing' | 'loading' | 'result'

  /* Repo / doc state */
  const [githubUrl,     setGithubUrl]     = useState('')
  const [repoId,        setRepoId]        = useState(null)
  const [onboardingDoc, setOnboardingDoc] = useState('')
  const [error,         setError]         = useState(null)

  /* Chat state */
  const [chatHistory, setChatHistory] = useState([])
  const [question,    setQuestion]    = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  /* Splitter / resize state */
  const [chatWidth, setChatWidth] = useState(420)
  const isDragging      = useRef(false)
  const startX          = useRef(0)
  const startChatWidth  = useRef(420)
  const containerRef    = useRef(null)

  /* ── Analyze handler ──────────────────────────────────── */
  const handleAnalyze = useCallback(async (urlArg) => {
    const url = (typeof urlArg === 'string' ? urlArg : githubUrl).trim()
    if (!url) return

    setError(null)
    setPhase('loading')

    try {
      const res = await axios.post(`${API_BASE}/analyze`, { github_url: url })
      setRepoId(res.data.repo_id)
      setOnboardingDoc(res.data.onboarding_doc)
      setChatHistory([])
      setQuestion('')
      setPhase('result')
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Something went wrong. Please check the URL and try again.'
      setError(detail)
      setPhase('landing')
    }
  }, [githubUrl])

  /* ── Chat handler ─────────────────────────────────────── */
  /**
   * Accepts an optional message string. When called from the send button /
   * keyboard Enter, the current `question` state is used. When called from
   * a suggestion chip, the suggestion string is passed directly.
   */
  const handleChat = useCallback(async (messageArg) => {
    const msg = (typeof messageArg === 'string' ? messageArg : question).trim()
    if (!msg || chatLoading) return

    const newHistory = [...chatHistory, { role: 'user', content: msg }]
    setChatHistory(newHistory)
    setQuestion('')
    setChatLoading(true)

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        repo_id:      repoId,
        question:     msg,
        chat_history: chatHistory,
      })
      setChatHistory([...newHistory, { role: 'assistant', content: res.data.answer }])
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Failed to get answer. Please try again.'
      setChatHistory([...newHistory, { role: 'assistant', content: `⚠️ ${detail}` }])
    } finally {
      setChatLoading(false)
    }
  }, [question, chatLoading, chatHistory, repoId])

  /* ── Back / reset ─────────────────────────────────────── */
  const handleBack = useCallback(() => {
    setPhase('landing')
    setRepoId(null)
    setOnboardingDoc('')
    setChatHistory([])
    setQuestion('')
    setError(null)
  }, [])

  /* ── Splitter drag logic ───────────────────────────────── */
  const onSplitterMouseDown = useCallback((e) => {
    isDragging.current     = true
    startX.current         = e.clientX
    startChatWidth.current = chatWidth
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [chatWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging.current) return
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth
      const delta      = startX.current - e.clientX   // drag left → chat grows
      const newW       = Math.min(
        containerW - MIN_DOC_WIDTH,
        Math.max(MIN_CHAT_WIDTH, startChatWidth.current + delta)
      )
      setChatWidth(newW)
    }

    const onMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current             = false
      document.body.style.cursor     = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [])

  /* ── Result view ──────────────────────────────────────── */
  if (phase === 'result') {
    return (
      <div className="app-result" ref={containerRef}>
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          variant="compact"
          onBack={handleBack}
          repoId={repoId}
        />
        <div className="result-content">
          <DocPanel onboardingDoc={onboardingDoc} repoId={repoId} />
          <Splitter onMouseDown={onSplitterMouseDown} />
          <ChatPanel
            chatHistory={chatHistory}
            question={question}
            setQuestion={setQuestion}
            chatLoading={chatLoading}
            onChat={handleChat}
            repoId={repoId}
            chatWidth={chatWidth}
            minWidth={MIN_CHAT_WIDTH}
          />
        </div>
      </div>
    )
  }

  /* ── Landing view (default + loading state) ───────────── */
  return (
    <div className="app-landing">
      <Navbar theme={theme} onToggleTheme={toggleTheme} variant="landing" />
      <main id="main-content">
        <HeroSection
          githubUrl={githubUrl}
          setGithubUrl={setGithubUrl}
          onAnalyze={handleAnalyze}
          isLoading={phase === 'loading'}
          error={error}
        />
        <AboutSection />
        <FeaturesSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default App