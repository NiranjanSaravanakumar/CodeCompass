# CodeCompass — System Architecture

> **Related Documents:**
> [component-diagram.md](./component-diagram.md) · [api-flow.md](./api-flow.md) · [database-flow.md](./database-flow.md) · [authentication-flow.md](./authentication-flow.md) · [request-lifecycle.md](./request-lifecycle.md) · [middleware.md](./middleware.md)

---

## 1. Overview

CodeCompass is a **full-stack AI-powered developer tool** that accepts a public GitHub repository URL, fetches its file tree and key source files, and generates:

1. A comprehensive **onboarding document** (AI-authored Markdown).
2. An interactive **chat interface** for follow-up questions about the codebase.

The system is split into two independently deployable tiers:

| Tier | Technology | Purpose |
|------|-----------|---------|
| **Frontend** | React 19 + Vite 8 | SPA served to the browser |
| **Backend** | FastAPI + Python | REST API, business logic, AI orchestration |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                               │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    React SPA (Vite)                          │  │
│   │                                                              │  │
│   │  Landing Page ──► [Analyze] ──► Result View                 │  │
│   │  HeroSection        │           DocPanel | Splitter | Chat   │  │
│   │  FeaturesSection    │                                        │  │
│   │  HowItWorks         │ axios HTTP                             │  │
│   └─────────────────────┼──────────────────────────────────────-┘  │
└─────────────────────────┼───────────────────────────────────────────┘
                          │  HTTP/REST  (port 8000)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                                 │
│                                                                     │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │
│   │  main.py     │   │github_service│   │  gemini_service.py   │   │
│   │  (Router)    │──►│   .py        │   │                      │   │
│   │              │   │  GitHub API  │   │  Gemini 2.5 Flash    │   │
│   │  /analyze    │   │  integration │   │  AI text generation  │   │
│   │  /chat       │   └──────┬───────┘   └──────────┬───────────┘   │
│   │  /health     │          │                       │               │
│   └──────────────┘          │                       │               │
│          │            repo_store: dict               │               │
│          └────────────────┬─┘ ◄────────────────────┘               │
│                           │                                         │
│                      In-Memory Store                                │
│                   { repo_id: repo_context }                         │
└─────────────────────────────────────────────────────────────────────┘
                          │                │
              ┌───────────┘                └────────────────┐
              ▼                                             ▼
 ┌────────────────────────┐               ┌────────────────────────────┐
 │     GitHub REST API    │               │   Google Gemini AI API     │
 │  api.github.com        │               │   generativelanguage.      │
 │  raw.githubusercontent │               │   googleapis.com           │
 └────────────────────────┘               └────────────────────────────┘
```

---

## 3. Deployment Topology

```
Developer Machine / Server
│
├── frontend/          → npm run dev  → http://localhost:5173
│     └── dist/        → Static files (Vite build)
│
└── backend/           → uvicorn main:app  → http://localhost:8000
      └── .venv/       → Python virtual environment
```

| Service | Default Port | Start Command |
|---------|-------------|---------------|
| Frontend (Vite dev) | `5173` | `npm run dev` |
| Backend (uvicorn) | `8000` | `uvicorn main:app --reload` |

---

## 4. Technology Stack

### Backend

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Web Framework | FastAPI | `0.135.3` | HTTP routing, request validation |
| ASGI Server | Uvicorn | `0.44.0` | Serve the FastAPI app |
| Data Validation | Pydantic v2 | `2.12.5` | Request/response schema |
| HTTP Client | `requests` | `2.33.1` | GitHub API calls |
| AI SDK | `google-generativeai` | `0.8.0` | Gemini model access |
| Config | `python-dotenv` | `1.2.2` | `.env` file loading |
| CORS | FastAPI built-in | — | Cross-origin policy |

### Frontend

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| UI Framework | React | `19.2.5` | Component-driven UI |
| Build Tool | Vite | `8.0.10` | Dev server, HMR, bundling |
| HTTP Client | Axios | `1.15.2` | REST calls to backend |
| Markdown Renderer | `react-markdown` | `10.1.0` | Render AI-generated docs |
| Styling | Vanilla CSS | — | Global design tokens + layout |

---

## 5. Data Flow Summary

```
1. User enters GitHub URL
2. Frontend → POST /analyze → Backend
3. Backend → GitHub API (tree + key files)
4. Backend → Gemini AI → Onboarding Markdown
5. Backend stores repo context in-memory (repo_store)
6. Backend → Frontend (repo_id + onboarding_doc)
7. Frontend renders DocPanel (Markdown) + ChatPanel
8. User asks question → POST /chat → Backend
9. Backend looks up repo context by repo_id
10. Backend → Gemini AI → Answer
11. Answer streamed back → displayed in ChatPanel
```

---

## 6. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **In-memory repo store** | Simplicity; no DB dependency for MVP |
| **File truncation at 3 000 chars** | Keeps AI prompts within token budgets |
| **Max 20 key files fetched** | Balances context richness vs. latency |
| **CORS wildcard (`*`)** | Dev convenience; restrict to origin in production |
| **Phase-based state machine** | Clean separation of `landing/loading/result` UI states |
| **Stateless chat** | Full `chat_history` sent with every request (no server-side session) |

---

## 7. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GITHUB_TOKEN` | Optional | GitHub PAT for higher rate limits |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://localhost:8000` | Backend base URL |

---

## 8. Security Considerations

> NOTE: Development State — Several items below must be addressed before production deployment.

- `CORS allow_origins=["*"]` should be locked to the frontend domain.
- `GITHUB_TOKEN` and `GEMINI_API_KEY` must never be committed to version control.
- The in-memory `repo_store` has no eviction, growing unbounded with usage.
- No rate limiting is applied to `/analyze` or `/chat` endpoints.
- No authentication is required to query any stored repo context.

---

*See [request-lifecycle.md](./request-lifecycle.md) for a step-by-step trace of a full analyze + chat session.*
