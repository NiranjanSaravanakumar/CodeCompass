# 🖥️ CodeCompass — Frontend

React + Vite client. Handles all UI, theming, layout, and API communication.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
```

Create a `.env` file (optional):

```env
VITE_API_BASE=http://localhost:8000
```

---

## Tech Stack

| Library | Version | Role |
|---|---|---|
| React | 19 | Component model & state |
| Vite | 8 | Dev server + bundler |
| react-markdown | 10 | Renders AI-generated Markdown |
| axios | 1.x | HTTP client for backend calls |
| Inter | — | UI font (Google Fonts) |
| JetBrains Mono | — | Code/mono font (Google Fonts) |

---

## Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx          ← Glassmorphism sticky nav, theme toggle
│   │   └── Footer.jsx          ← Multi-column footer
│   ├── landing/
│   │   ├── HeroSection.jsx     ← URL input, animated hero background
│   │   ├── AboutSection.jsx    ← Problem/solution copy
│   │   ├── FeaturesSection.jsx ← Feature card grid
│   │   ├── HowItWorks.jsx      ← 5-step numbered flow
│   │   └── CTASection.jsx      ← Call-to-action banner
│   └── app/
│       ├── DocPanel.jsx        ← Onboarding doc viewer (react-markdown)
│       ├── ChatPanel.jsx       ← AI chat — message list + input
│       └── Splitter.jsx        ← Drag-to-resize divider between panels
├── hooks/
│   └── useTheme.js             ← Dark/light mode, localStorage, system pref
├── App.jsx                     ← Phase state machine: landing → loading → result
├── App.css                     ← Component-level styles
└── index.css                   ← Global CSS token system (design variables)
```

---

## UI Architecture

### Phase State Machine

`App.jsx` controls a single `phase` state that drives the whole experience:

```
"landing"  →  user pastes URL and clicks Analyze
     ↓
"loading"  →  spinner shown, POST /analyze in progress
     ↓
"result"   →  split view: DocPanel (left) + ChatPanel (right)
```

### Design System (CSS Variables)

All colours, spacing, shadows, and radii are defined as CSS custom properties in `index.css`.
Components never use hardcoded values — they consume tokens like `var(--color-primary)`.

| Category | Example tokens |
|---|---|
| Colours | `--color-primary`, `--color-secondary`, `--color-accent` |
| Backgrounds | `--bg-base`, `--bg-surface`, `--bg-elevated` |
| Text | `--text-primary`, `--text-secondary`, `--text-tertiary` |
| Spacing | `--space-1` … `--space-24` (4px scale) |
| Radius | `--radius-sm` … `--radius-full` |
| Shadows | `--shadow-sm` … `--shadow-xl` |
| Transitions | `--transition-fast`, `--transition-base`, `--transition-slow` |

Both dark and light themes are declared in the same file using `[data-theme="dark"]` and `[data-theme="light"]` selectors.

### Accessibility — Colour Contrast

All text tokens are tuned to meet **WCAG AA** (4.5:1 minimum):

| Token | Dark value | Light value | Contrast |
|---|---|---|---|
| `--text-primary` | `#F0EEE8` | `#1A1917` | ~15:1 ✅ |
| `--text-secondary` | `#DEDAD2` | `#1E1C19` | ~12:1 ✅ |
| `--text-tertiary` | `#A8A39C` | `#3D3B37` | ~5.5:1 ✅ |

### Splitter (Drag-to-Resize)

`Splitter.jsx` tracks `mousedown` → `mousemove` → `mouseup` events.
The left panel width is stored as a percentage in a `useState` hook and applied as an inline style.
No external library — pure DOM event handling.

---

## API Communication

All backend calls are made with `axios` in `App.jsx`:

```js
// Analyze a repo
POST http://localhost:8000/analyze
Body: { github_url: "https://github.com/owner/repo" }
Returns: { repo_id, onboarding_doc, from_cache }

// Chat
POST http://localhost:8000/chat
Body: { repo_id, question, chat_history: [...] }
Returns: { answer, from_cache }
```

When `from_cache: true` is returned, the response is instant (served from backend cache).

---

## Development Tips

- **Hot reload** — Vite reloads on every save. No manual refresh needed.
- **Theme** — Toggle with the sun/moon icon in the navbar. Preference is saved to `localStorage`.
- **Backend URL** — Change `VITE_API_BASE` in `.env` to point to any backend instance.
- **Markdown rendering** — `DocPanel` uses `react-markdown`. Code blocks in the AI response get a monospace font automatically via CSS.
