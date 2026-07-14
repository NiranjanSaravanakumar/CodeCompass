# CodeCompass — Component Diagram

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [api-flow.md](./api-flow.md) · [request-lifecycle.md](./request-lifecycle.md)

---

## 1. Overview

This document maps every React component and Python module in CodeCompass, showing the parent–child relationships, props passed between components, and how the frontend connects to backend services.

---

## 2. Frontend Component Tree

```
App (src/App.jsx)  ← Root component / state machine
│
│── Phase: 'landing' or 'loading'
│   │
│   ├── Navbar (variant="landing")
│   │     Props: theme, onToggleTheme, variant
│   │
│   └── <main>
│         ├── HeroSection
│         │     Props: githubUrl, setGithubUrl, onAnalyze, isLoading, error
│         ├── AboutSection         (no props)
│         ├── FeaturesSection      (no props)
│         ├── HowItWorks           (no props)
│         └── CTASection           (no props)
│
│           Footer (no props)
│
└── Phase: 'result'
    │
    ├── Navbar (variant="compact")
    │     Props: theme, onToggleTheme, variant, onBack, repoId
    │
    └── <div.result-content>
          ├── DocPanel
          │     Props: onboardingDoc, repoId
          │
          ├── Splitter
          │     Props: onMouseDown
          │
          └── ChatPanel
                Props: chatHistory, question, setQuestion,
                       chatLoading, onChat, repoId, chatWidth, minWidth
```

---

## 3. Component Responsibility Matrix

### Layout Components (`src/components/layout/`)

| Component | File | Description |
|-----------|------|-------------|
| `Navbar` | `Navbar.jsx` | Sticky glassmorphism nav bar with two variants: `landing` (full links + CTA) and `compact` (back button + repo pill). Handles smooth-scroll, mobile hamburger menu, and theme toggle. |

### Landing Page Components (`src/components/landing/`)

| Component | File | Description |
|-----------|------|-------------|
| `HeroSection` | `HeroSection.jsx` | Primary CTA — GitHub URL input, Analyze button, error display, and loading state. Drives the analyze flow by calling `onAnalyze`. |
| `AboutSection` | `AboutSection.jsx` | Static marketing copy about the project. |
| `FeaturesSection` | `FeaturesSection.jsx` | Feature cards grid. |
| `HowItWorks` | `HowItWorks.jsx` | Numbered steps explaining the workflow. |
| `CTASection` | `CTASection.jsx` | Secondary call-to-action at the bottom of the landing page. |

### App / Result Components (`src/components/app/`)

| Component | File | Description |
|-----------|------|-------------|
| `DocPanel` | `DocPanel.jsx` | Left pane. Renders the AI-generated onboarding Markdown via `react-markdown`. Stateless. |
| `Splitter` | `Splitter.jsx` | Drag handle between `DocPanel` and `ChatPanel`. Fires `onMouseDown` to parent for resize logic. |
| `ChatPanel` | `ChatPanel.jsx` | Right pane. Renders chat history, typing indicator, suggestion chips, and the message input. Calls `onChat()` to send messages. |

---

## 4. Props Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                     App.jsx                         │
│                                                     │
│  State: phase, githubUrl, repoId, onboardingDoc,    │
│          error, chatHistory, question, chatLoading, │
│          chatWidth, theme                           │
│                                                     │
│  Handlers: handleAnalyze, handleChat, handleBack,   │
│             onSplitterMouseDown                     │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
  [Navbar]   [DocPanel]  [Splitter]  [ChatPanel]
       │          │          │          │
  theme        onboardingDoc  onMouseDown  chatHistory
  onToggleTheme  repoId              question
  variant                            setQuestion
  onBack                             chatLoading
  repoId                             onChat
                                     repoId
                                     chatWidth
                                     minWidth
```

---

## 5. Backend Module Diagram

```
┌─────────────────────────────────────────────────────┐
│                    main.py                          │
│                                                     │
│  app = FastAPI()                                    │
│  repo_store: dict  (in-memory)                      │
│                                                     │
│  Routes:                                            │
│    GET  /          → health check                   │
│    GET  /health    → health check                   │
│    POST /analyze   → uses github_service            │
│                          + gemini_service           │
│    POST /chat      → uses gemini_service            │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴─────────────┐
          ▼                          ▼
┌──────────────────┐      ┌─────────────────────────┐
│ github_service.py│      │   gemini_service.py      │
│                  │      │                          │
│ parse_github_url │      │ _generate_text()         │
│ _github_get()    │      │   → model.generate_      │
│ fetch_repo_tree()│      │      content()           │
│ fetch_default_   │      │                          │
│   branch()       │      │ generate_onboarding()    │
│ fetch_file_      │      │   → builds prompt from   │
│   content()      │      │     repo_context         │
│ get_repo_context │      │                          │
│   () ← main      │      │ answer_question()        │
│   entry point    │      │   → builds prompt from   │
└──────────────────┘      │     repo_context +       │
          │               │     chat_history          │
          ▼               └─────────────────────────┘
 ┌──────────────────┐               │
 │  GitHub REST API │               ▼
 │  api.github.com  │    ┌─────────────────────────┐
 │  raw.github...   │    │  Google Gemini API       │
 └──────────────────┘    │  gemini-2.5-flash model  │
                         └─────────────────────────┘
```

---

## 6. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useTheme` | `src/hooks/useTheme.js` | Reads theme from `localStorage` (key: `cc-theme`), writes `data-theme` attribute to `<html>`, and provides a `toggleTheme` callback. Used only by `App.jsx`. |

---

## 7. CSS Architecture

| File | Purpose |
|------|---------|
| `src/index.css` | Global reset, CSS custom properties (design tokens), typography base |
| `src/App.css` | Component-level styles: navbar, hero, panels, chat, splitter, dark mode overrides |

---

*See [api-flow.md](./api-flow.md) for HTTP request/response contracts between these components and the backend.*
