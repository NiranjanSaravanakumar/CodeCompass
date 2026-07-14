<div align="center">

<img src="https://img.shields.io/badge/CodeCompass-v1.0.0-2A9068?style=for-the-badge" alt="CodeCompass v1.0.0" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19" />
<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
<img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google" alt="Gemini AI" />
<img src="https://img.shields.io/badge/License-MIT-D8A84C?style=for-the-badge" alt="MIT License" />

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

---

## Features

| Feature | Description |
|---|---|
| 🤖 **AI Onboarding Doc** | Gemini 2.5 Flash generates a complete onboarding guide from your repo |
| 💬 **Contextual Chat** | Ask specific questions, get specific answers grounded in your actual code |
| 🐙 **GitHub Integration** | Works with any public GitHub repo — paste the URL and go |
| ↔️ **Resizable Split View** | Drag the splitter to customize the doc/chat ratio |
| 🌙 **Dark & Light Mode** | Full theme system with localStorage persistence and system preference detection |
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
| Vanilla CSS | — | Full custom design system |

### Backend
| Tech | Version | Role |
|---|---|---|
| FastAPI | 0.115+ | REST API framework |
| Python | 3.11+ | Runtime |
| google-generativeai | — | Gemini 2.5 Flash integration |
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
│  │ github_service│      │ gemini_service│               │
│  │ (fetch repo) │──────▶│  (AI answer) │               │
│  └──────────────┘       └──────────────┘                │
└─────────────────────────────────────────────────────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
    GitHub API                    Gemini AI API
    (repo tree,                  (onboarding doc,
    file contents)                chat responses)
```

---

## Folder Structure

```
CodeCompass/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx        ← Glassmorphism sticky navbar
│   │   │   │   └── Footer.jsx        ← Multi-column footer
│   │   │   ├── landing/
│   │   │   │   ├── HeroSection.jsx   ← URL input + animated background
│   │   │   │   ├── AboutSection.jsx  ← Problem/solution narrative
│   │   │   │   ├── FeaturesSection.jsx
│   │   │   │   ├── HowItWorks.jsx    ← 5-step visual flow
│   │   │   │   └── CTASection.jsx
│   │   │   └── app/
│   │   │       ├── DocPanel.jsx      ← Onboarding doc viewer
│   │   │       ├── ChatPanel.jsx     ← AI chat interface
│   │   │       └── Splitter.jsx      ← Drag-to-resize divider
│   │   ├── hooks/
│   │   │   └── useTheme.js           ← Dark/light mode hook
│   │   ├── App.jsx                   ← Root — phase state machine
│   │   ├── App.css                   ← Complete design system
│   │   └── index.css                 ← CSS token system (variables)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── main.py                       ← FastAPI app + routes
    ├── github_service.py             ← GitHub API integration
    ├── gemini_service.py             ← Gemini AI integration
    ├── requirements.txt
    └── .env                          ← API keys (not committed)
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)
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
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here   # optional
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
  "onboarding_doc": "# Project Overview\n..."
}
```

### `POST /chat`

Answers a question about a previously analyzed repository.

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
  "answer": "Authentication is handled via..."
}
```

### `GET /health`

Health check endpoint.

---

## Environment Variables

| Variable | Location | Required | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` | ✅ Yes | Google Gemini API key |
| `GITHUB_TOKEN` | `backend/.env` | Optional | GitHub PAT for higher rate limits |
| `VITE_API_BASE` | `frontend/.env` | Optional | Backend URL (defaults to `http://localhost:8000`) |

---

## Design System

CodeCompass uses a custom design system with CSS custom properties:

| Token | Dark | Light |
|---|---|---|
| `--color-primary` | `#2A9068` | `#1F6F50` (Forest Green) |
| `--color-secondary` | `#D4834A` | `#C46A2D` (Burnt Orange) |
| `--color-accent` | `#E8BB5C` | `#D8A84C` (Warm Gold) |
| `--bg-base` | `#141414` | `#F7F6F3` |
| `--bg-surface` | `#1C1C1C` | `#FFFFFF` |

Typography: **Inter** (UI) + **JetBrains Mono** (code)

---

## Future Roadmap

- [ ] Private repository support via GitHub OAuth
- [ ] Repository comparison mode
- [ ] Export onboarding doc as PDF / Markdown
- [ ] Shareable repository analysis links
- [ ] VS Code extension
- [ ] Organization-wide repository discovery
- [ ] Code search within the AI chat

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for developers everywhere.<br/>
**CodeCompass** — Navigate any codebase with AI precision.

</div>
