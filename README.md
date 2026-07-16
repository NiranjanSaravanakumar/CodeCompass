<div align="center">

<img src="https://img.shields.io/badge/CodeCompass-v1.1.0-2A9068?style=for-the-badge" alt="CodeCompass v1.1.0" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
<img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=for-the-badge&logo=groq" alt="Groq AI" />
<img src="https://img.shields.io/badge/Cache-24h_TTL-D8A84C?style=for-the-badge" alt="Smart Cache" />
<img src="https://img.shields.io/badge/License-MIT-706C66?style=for-the-badge" alt="MIT License" />

# CodeCompass

### Navigate any codebase with AI precision

**Paste a GitHub repository URL. Get a comprehensive onboarding guide and an AI assistant that knows your entire codebase — in under 60 seconds.**

[**Try CodeCompass →**](#getting-started)

</div>

---

## What is CodeCompass?

Joining a new team or contributing to an open-source project means spending days — sometimes weeks — understanding the codebase before writing a single meaningful line of code.

**CodeCompass eliminates that ramp-up time.**

Connect any GitHub repository and instantly get:
- 📄 A **structured onboarding document** — project overview, tech stack, folder structure, key files, and setup steps
- 💬 An **AI chat assistant** that knows your codebase inside and out
- 🏗️ An **architecture overview** that maps how services and modules connect
- ⚡ **Smart caching** — repeated analyses and chat questions are served instantly at zero token cost

---

## Features

| Feature | Description |
|---|---|
| 🤖 **AI Onboarding Doc** | Groq LLaMA 3.3 70B generates a complete onboarding guide from your repo |
| 💬 **Contextual Chat** | Ask specific questions, get specific answers grounded in your actual code |
| 🐙 **GitHub Integration** | Works with any public GitHub repo — paste the URL and go |
| 🗄️ **Smart Caching** | 24-hour TTL cache for onboarding docs and chat answers — saves ~75% of API tokens |
| ↔️ **Resizable Split View** | Drag the splitter to customize the doc/chat ratio |
| 🌙 **Dark & Light Mode** | Full theme system with localStorage persistence and system preference detection |
| ♿ **Accessible Colours** | WCAG AA-compliant contrast ratios across both themes |
| ⚡ **Fast** | Analysis completes in under 60 seconds for most repositories |

---

## Tech Stack

### Frontend
| Tech | Version | Role |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| react-markdown | 10 | Markdown rendering |
| axios | 1.x | HTTP client |
| Inter + JetBrains Mono | — | Typography (Google Fonts) |
| Vanilla CSS | — | Full custom design system with CSS variables |

### Backend
| Tech | Version | Role |
|---|---|---|
| FastAPI | 0.115+ | REST API framework |
| Python | 3.11+ | Runtime |
| groq | 1.5.0 | Groq LLaMA 3.3 70B integration |
| requests | — | GitHub API calls |
| python-dotenv | — | Environment config |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                     │
│                                                         │
│  Landing Page                                           │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────┐ │
│  │   Hero   │  │  About   │  │ Features  │  │  How  │ │
│  └──────────┘  └──────────┘  └───────────┘  └───────┘ │
│                                                         │
│  Result View                                            │
│  ┌───────────────────┬──┬──────────────────────┐       │
│  │    Doc Panel      │  │     Chat Panel        │       │
│  │ (Onboarding doc)  │││ │ (AI conversation)     │       │
│  └───────────────────┴──┴──────────────────────┘       │
│                       ↕ axios                           │
└───────────────────────┼─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  FastAPI Backend                         │
│                                                         │
│  POST /analyze          POST /chat                      │
│  ┌──────────────┐       ┌──────────────┐                │
│  │github_service│──────▶│ groq_service │                │
│  │ (fetch repo) │       │ (AI answer)  │                │
│  └──────┬───────┘       └──────┬───────┘                │
│         │                      │                        │
│  ┌──────▼──────────────────────▼───────┐                │
│  │          cache_service              │                │
│  │  onboarding cache + chat cache      │                │
│  │  (24h TTL, in-memory)               │                │
│  └─────────────────────────────────────┘                │
│                                                         │
│  GET  /cache/stats   POST /cache/clear                  │
└─────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    GitHub API                      Groq API
    (repo tree,                  (onboarding doc,
    file contents)                chat responses)
```

---

## Token Optimisation

CodeCompass uses several strategies to minimise Groq API token usage:

| Strategy | Detail | Saving |
|---|---|---|
| **Onboarding cache** | Same repo analyzed again → served from cache | ~100% |
| **Chat answer cache** | Same question asked again → served from cache | ~100% |
| **File count limit** | Fetches top 8 priority files (was 20) | ~-60% files |
| **File content limit** | Truncates each file at 1,200 chars (was 3,000) | ~-60% per file |
| **Folder path limit** | Sends 40 paths (was 100) | ~-60 lines |
| **Compact prompt** | Concise instruction format | ~-200 tokens |
| **Output limit** | max_tokens = 2,048 for onboarding (was 4,096) | ~-50% output |
| **Combined total** | Approx. per-analyze savings | **~75% fewer tokens** |

Files are fetched in priority order: `README` → config files (`package.json`, `requirements.txt`) → entry points → build/infra files.

---

## Folder Structure

```
CodeCompass/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx          ← Glassmorphism sticky navbar
│   │   │   │   └── Footer.jsx          ← Multi-column footer
│   │   │   ├── landing/
│   │   │   │   ├── HeroSection.jsx     ← URL input + animated background
│   │   │   │   ├── AboutSection.jsx    ← Problem/solution narrative
│   │   │   │   ├── FeaturesSection.jsx
│   │   │   │   ├── HowItWorks.jsx      ← 5-step visual flow
│   │   │   │   └── CTASection.jsx
│   │   │   └── app/
│   │   │       ├── DocPanel.jsx        ← Onboarding doc viewer
│   │   │       ├── ChatPanel.jsx       ← AI chat interface
│   │   │       └── Splitter.jsx        ← Drag-to-resize divider
│   │   ├── hooks/
│   │   │   └── useTheme.js             ← Dark/light mode hook
│   │   ├── App.jsx                     ← Root — phase state machine
│   │   ├── App.css                     ← Complete design system
│   │   └── index.css                   ← CSS token system (variables)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── main.py                         ← FastAPI app + all routes
    ├── github_service.py               ← GitHub API integration
    ├── groq_service.py                 ← Groq LLaMA AI integration
    ├── cache_service.py                ← In-memory TTL cache (onboarding + chat)
    ├── requirements.txt
    └── .env                            ← API keys (not committed)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- A **Groq API key** from [Groq Console](https://console.groq.com/)
- (Optional) A **GitHub personal access token** for higher rate limits

### 1. Clone the repository

```bash
git clone https://github.com/your-username/CodeCompass.git
cd CodeCompass
```

### 2. Set up the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here   # optional — higher GitHub rate limits
```

Start the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

### 4. Open in browser

Navigate to **http://localhost:5173**

---

## API Reference

### `POST /analyze`

Fetches a GitHub repository and generates an AI onboarding document.
Responses are cached for 24 hours — repeated calls for the same repo are instant.

**Request body:**
```json
{
  "github_url": "https://github.com/owner/repo"
}
```

**Response:**
```json
{
  "repo_id": "owner/repo",
  "onboarding_doc": "# Project Overview\n...",
  "from_cache": false
}
```

---

### `POST /chat`

Answers a question about a previously analyzed repository.
Repeated identical questions are served from cache.

**Request body:**
```json
{
  "repo_id": "owner/repo",
  "question": "How does authentication work?",
  "chat_history": []
}
```

**Response:**
```json
{
  "answer": "Authentication is handled via...",
  "from_cache": false
}
```

---

### `GET /cache/stats`

Returns live cache metrics.

**Response:**
```json
{
  "onboarding_cached": 3,
  "chat_answers_cached": 12,
  "ttl_hours": 24,
  "checked_at": "2026-07-15T11:00:00"
}
```

---

### `POST /cache/clear`

Manually flushes all cached entries. Useful during development.

**Response:**
```json
{
  "cleared_onboarding": 3,
  "cleared_chat": 12
}
```

---

### `GET /health`

Health check endpoint.

---

## Environment Variables

| Variable | Location | Required | Description |
|---|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | ✅ Yes | Groq API key (free at console.groq.com) |
| `GITHUB_TOKEN` | `backend/.env` | Optional | GitHub PAT for higher rate limits |
| `VITE_API_BASE` | `frontend/.env` | Optional | Backend URL (defaults to `http://localhost:8000`) |

---

## Design System

CodeCompass uses a custom CSS token system with full dark/light theme support and WCAG AA-compliant contrast ratios.

| Token | Dark | Light |
|---|---|---|
| `--color-primary` | `#2A9068` | `#1F6F50` (Forest Green) |
| `--color-secondary` | `#D4834A` | `#C46A2D` (Burnt Orange) |
| `--color-accent` | `#E8BB5C` | `#D8A84C` (Warm Gold) |
| `--bg-base` | `#141414` | `#F7F6F3` |
| `--bg-surface` | `#1C1C1C` | `#FFFFFF` |
| `--text-primary` | `#F0EEE8` | `#1A1917` |
| `--text-secondary` | `#DEDAD2` | `#1E1C19` |
| `--text-tertiary` | `#A8A39C` | `#3D3B37` |

Typography: **Inter** (UI) + **JetBrains Mono** (code)

---

## UI Deep Dive

### Component Model

The UI is built in React 19 with a **phase-based state machine** in `App.jsx`:

```
"landing"  ──→  User pastes GitHub URL and clicks Analyze
    ↓
"loading"  ──→  Spinner shown while POST /analyze runs (~5–30s)
    ↓
"result"   ──→  Split-panel view: DocPanel (left) + ChatPanel (right)
```

### Layout — Split Panel

The result view uses a **drag-to-resize splitter**:

```
┌─────────────────────────┬─┬────────────────────────┐
│      DocPanel           │ │      ChatPanel          │
│  (Markdown rendered     │║│  (message list +        │
│   onboarding doc)       │ │   text input)           │
└─────────────────────────┴─┴────────────────────────┘
         ↕ drag handle (Splitter.jsx)
```

`Splitter.jsx` uses raw DOM events (`mousedown → mousemove → mouseup`) to track the drag position and updates panel widths as CSS percentages — no library needed.

### Theming

`useTheme.js` implements a three-way priority system:

```
1. User preference saved in localStorage   (highest priority)
2. OS/system preference via prefers-color-scheme media query
3. Default: dark mode                      (fallback)
```

The selected theme is written as `data-theme="dark"` or `data-theme="light"` on the `<html>` element, which activates the correct CSS variable block in `index.css`.

### Accessibility

All text/background colour pairs are tested against the **WCAG AA standard** (minimum 4.5:1 contrast ratio):

| Token pair | Contrast | WCAG |
|---|---|---|
| `--text-primary` on `--bg-base` (dark) | ~15:1 | ✅ AAA |
| `--text-secondary` on `--bg-base` (dark) | ~12:1 | ✅ AAA |
| `--text-tertiary` on `--bg-base` (dark) | ~5.5:1 | ✅ AA |
| `--text-primary` on `--bg-base` (light) | ~15:1 | ✅ AAA |
| `--text-secondary` on `--bg-base` (light) | ~14:1 | ✅ AAA |
| `--text-tertiary` on `--bg-base` (light) | ~7:1 | ✅ AA |

**Rule:** Never use `--text-tertiary` for body copy — reserve it for timestamps, hints, and disabled states only.

---

## Database & Storage

### Current State — No Persistent Database

CodeCompass v1.1 intentionally uses **no database**. All state is ephemeral and lives in Python dicts in the running process:

```python
repo_store: dict = {}   # repo_id → repo_context (tree + file contents)
```

| Layer | What's stored | Persistence |
|---|---|---|
| `repo_store` | Raw GitHub data (file paths, contents) | RAM only — lost on restart |
| `cache._onboarding_cache` | AI-generated onboarding docs | RAM only — lost on restart |
| `cache._chat_cache` | AI chat answers | RAM only — lost on restart |
| Browser `localStorage` | User's theme preference | Persists in browser |

### Why No Database (by design)

- **Zero setup** — users can run the app with just two terminal commands
- **No data residency concerns** — nothing is written to disk
- **Stateless scaling** — each server instance is independent

### Future: Persistent Storage Options

| Option | Use case | Complexity |
|---|---|---|
| **SQLite** | Single-server persistence across restarts | Low |
| **Redis** | Shared cache across multiple server instances | Medium |
| **PostgreSQL** | Full user accounts, saved analyses, history | High |

To add SQLite caching, the `CacheService` class would replace its internal dicts with a SQLite table, keeping the same `get/set` API surface — no changes needed in `main.py`.

---

## Cache Deep Dive

### How the Cache Works

```
Request → main.py
    ↓
cache.get_onboarding(repo_id)
    ├── Hit  → return cached doc immediately  ✅ (0 tokens, <1ms)
    └── Miss → call groq_service → cache.set_onboarding() → return doc
```

### Key Structure

| Cache layer | Key | Value |
|---|---|---|
| Onboarding | `"facebook/react"` (repo_id string) | `{ doc: "...", time: datetime }` |
| Chat | `md5("facebook/react:what does it do?")` | `{ answer: "...", time: datetime }` |

The chat key is **case-insensitive** and **whitespace-normalised** — `"What does it do?"` and `"what does it do?"` hit the same cache entry.

### TTL (Time-To-Live) Expiry

```
Entry created at  T=0
TTL = 24 hours
Checked at        T=25h  →  _is_expired() = True  →  cache miss (fresh call)
```

No background thread needed — expiry is checked lazily at read time.

### Big O

| Operation | Time | Space |
|---|---|---|
| `get_onboarding` | **O(1)** | O(1) |
| `set_onboarding` | **O(1)** | O(n) total |
| `get_chat` | **O(1)** (md5 is fixed-length hash) | O(1) |
| `set_chat` | **O(1)** | O(n) total |
| `get_stats` | **O(n)** — iterates all entries | O(1) |
| `clear` | **O(n)** — empties both dicts | O(1) |

`n` = total cached entries. Typically stays in single digits during normal use.

### Token Savings

| Scenario | Without cache | With cache | Saved |
|---|---|---|---|
| 10 users, same repo | 10 × ~2,800 tokens | 1 × 2,800 tokens | **~90%** |
| Same question ×5 | 5 × ~800 tokens | 1 × 800 tokens | **~80%** |

---

## Code Quality & Big O

### Algorithmic Complexity — Full System

#### `github_service.py`

| Function | Time | Space | Notes |
|---|---|---|---|
| `parse_github_url` | O(1) | O(1) | String split, constant ops |
| `fetch_repo_tree` | O(t) | O(t) | t = files in repo; network-bound |
| `fetch_default_branch` | O(1) | O(1) | Single API call |
| `fetch_file_content` | O(c) | O(c) | c = file size, capped at 1,200 chars |
| `get_repo_context` — sort step | O(f log f) | O(f) | f = matched priority files (≤ 8) |
| `get_repo_context` — full | **O(t + f·c)** | O(t) | Dominated by tree fetch |

#### `groq_service.py`

| Function | Time | Space | Notes |
|---|---|---|---|
| `generate_onboarding` | O(p) | O(p) | p = prompt size; dominated by Groq call |
| `answer_question` | O(p + h) | O(p + h) | h = chat history length |

Groq API latency (network + model inference) dominates all internal complexity.

#### `cache_service.py`

All cache operations are O(1) amortised. See Cache section above.

#### `main.py` (routes)

| Route | Time | Bottleneck |
|---|---|---|
| `POST /analyze` (cache hit) | O(1) | Dict lookup |
| `POST /analyze` (cache miss) | O(t + p) | GitHub fetch + Groq inference |
| `POST /chat` (cache hit) | O(1) | Dict lookup |
| `POST /chat` (cache miss) | O(p + h) | Groq inference |

### Code Quality Practices

| Practice | Where applied |
|---|---|
| **Type hints** | All function signatures in all `.py` files |
| **Single responsibility** | Each file owns exactly one concern (fetch / generate / cache / route) |
| **Constants over magic numbers** | `MAX_FILE_CHARS = 1200`, `MAX_FILES = 8` in `github_service.py` |
| **Priority-ordered file selection** | `IMPORTANT_FILES_PRIORITY` list gives deterministic, reproducible file selection |
| **Graceful degradation** | GitHub token missing → retries without auth; Groq key missing → clear runtime error |
| **Cache key normalisation** | `.strip().lower()` prevents duplicate entries for same question with different casing |
| **Singleton pattern** | `cache = CacheService(ttl_hours=24)` — one instance shared across all requests |

---

## Preparation Tips & Tricks

If you're using CodeCompass to onboard to a new codebase, here are proven strategies to get the most from it:

### 🔍 Getting the Best Onboarding Doc

1. **Analyze first, read second** — let the AI doc load completely before scrolling. The structure (Overview → Stack → Folders → Key Files → Setup → Architecture) mirrors how experienced engineers mentally model a new repo.

2. **Cross-check the tech stack** — the AI identifies frameworks from `package.json` / `requirements.txt`. Verify versions against what's actually installed if the repo is actively maintained.

3. **Follow the "Getting Started" steps exactly** — copy the setup commands verbatim into your terminal rather than paraphrasing.

### 💬 Getting the Best Chat Answers

4. **Ask specific, scoped questions** — instead of `"explain the code"`, ask `"what does the /api/users endpoint do and which file handles it?"`.

5. **Chain questions** — the chat maintains history. Start broad (`"what is the auth flow?"`) then drill down (`"how does the JWT token get validated in that flow?"`).

6. **Ask about files you can't find** — `"where is the database connection configured?"` or `"which file should I edit to add a new API route?"`.

7. **Ask for code examples** — `"show me how to add a new endpoint following the existing pattern"`.

### ⚡ Performance Tips

8. **Analyze once, chat many times** — the onboarding doc is cached for 24 hours. Share the repo analysis link with teammates so everyone benefits from the single Groq call.

9. **Use the splitter** — drag the panel divider so the doc is wider when reading and the chat is wider when asking questions.

10. **Bookmark the result** — after analysis, the `repo_id` (e.g. `owner/repo`) is stable for 24 hours. You can re-enter it in a new session without re-analyzing.

### 🛠️ Developer Tips (Contributing / Extending)

11. **Test prompts without burning tokens** — use `POST /cache/clear` to force a fresh Groq call after editing `groq_service.py`.

12. **Use Swagger UI** — visit `http://localhost:8000/docs` to call any endpoint manually without writing frontend code.

13. **Watch token usage** — check your [Groq Console dashboard](https://console.groq.com) after each test run to understand real-world token consumption.

14. **Add new file types** — to support more languages, add filenames to `IMPORTANT_FILES_PRIORITY` in `github_service.py`. Higher position = higher priority.

15. **Tune the cache TTL** — change `CacheService(ttl_hours=24)` in `cache_service.py` to `ttl_hours=1` during development so stale responses don't mask your prompt changes.

---

## Future Roadmap

- [ ] Private repository support via GitHub OAuth
- [ ] Persistent cache (SQLite / Redis) across server restarts
- [ ] Repository comparison mode
- [ ] Export onboarding doc as PDF / Markdown
- [ ] Shareable repository analysis links
- [ ] VS Code extension
- [ ] Organization-wide repository discovery
- [ ] Code search within the AI chat

---


<div align="center">

Built with ❤️ for developers everywhere.<br/>
**CodeCompass** — Navigate any codebase with AI precision.

</div>
