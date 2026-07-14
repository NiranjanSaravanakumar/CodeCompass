# CodeCompass — Authentication Flow

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [api-flow.md](./api-flow.md) · [middleware.md](./middleware.md)

---

## 1. Overview

CodeCompass in its current form has **no user authentication**. However, it does manage two forms of external API authentication:

1. **GitHub API Authentication** — An optional Personal Access Token (PAT) to increase rate limits when fetching repository data.
2. **Google Gemini API Authentication** — A required API key for AI text generation.

This document covers both external authentication flows and outlines the path to adding user authentication in the future.

---

## 2. External API Authentication

### 2.1 GitHub API Authentication

GitHub imposes rate limits on unauthenticated requests:

| Mode | Rate Limit |
|------|-----------|
| Unauthenticated | 60 requests / hour |
| Authenticated (PAT) | 5 000 requests / hour |

#### Token Source

```
backend/.env
└── GITHUB_TOKEN=github_pat_...
```

Loaded at startup via `python-dotenv`:

```python
# github_service.py
from dotenv import load_dotenv
load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
```

#### Request Flow

```
_github_get(url)
│
├── GITHUB_TOKEN present?
│   ├── Yes → Add "Authorization: Bearer <token>" header
│   └── No  → Omit Authorization header (public access only)
│
├── Make GET request
│
└── Response status == 401 AND token was present?
    ├── Yes → Retry WITHOUT Authorization header (token invalid)
    └── No  → Return response as-is
```

#### Code Implementation

```python
def _github_get(url: str) -> requests.Response:
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    response = requests.get(url, headers=headers)
    if response.status_code == 401 and GITHUB_TOKEN:
        # Token is invalid — fall back to unauthenticated
        response = requests.get(url, headers={"Accept": "application/vnd.github+json"})
    return response
```

#### Error Handling

| GitHub Status | Handling |
|--------------|---------|
| `200` | Continue normally |
| `401` (with token) | Retry unauthenticated; if still `401` → raise `ValueError` |
| `401` (no token) | Raise `ValueError` with explanation |
| `404` | Raise `ValueError("Repo not found or is private.")` |
| Other | Raise `HTTPError` via `response.raise_for_status()` |

---

### 2.2 Google Gemini API Authentication

#### Token Source

```
backend/.env
└── GEMINI_API_KEY=AIza...
```

#### Initialization

```python
# gemini_service.py
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL   = "gemini-2.5-flash"

if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(MODEL)
else:
    model = None  # All generation calls will raise RuntimeError
```

#### Runtime Guard

```python
def _generate_text(prompt: str, max_tokens: int) -> str:
    if not model:
        raise RuntimeError("GEMINI_API_KEY is not set")
    ...
```

If `GEMINI_API_KEY` is missing, any call to `/analyze` or `/chat` will result in a `500 Internal Server Error`.

---

## 3. Secrets Management

| Secret | Storage | Access Pattern |
|--------|---------|---------------|
| `GITHUB_TOKEN` | `backend/.env` | Loaded once at module import |
| `GEMINI_API_KEY` | `backend/.env` | Loaded once at module import |
| `VITE_API_BASE` | `frontend/.env` | Embedded at Vite build time |

```
backend/.env          ←  git-ignored, server-side only
frontend/.env         ←  git-ignored, embedded into JS bundle at build time
```

> WARNING: `VITE_API_BASE` and any `VITE_*` variables are **publicly visible** in the built JavaScript bundle. Never store secrets in frontend environment variables.

---

## 4. Current Authentication State (No User Auth)

```
User Browser ──► CodeCompass Frontend ──► CodeCompass Backend
                                               │
                                    No session, no token,
                                    no user identity.
                                    Any caller can use
                                    any repo_id.
```

**Implications:**
- Anyone who discovers the backend URL can call `/analyze` on any public repo.
- Anyone who discovers a `repo_id` can call `/chat` against it.
- No user isolation exists between different users' sessions.

---

## 5. Recommended: Adding User Authentication

The following flow describes how to add GitHub OAuth for user authentication, which would simultaneously provide a user identity and a GitHub token tied to that user.

### 5.1 GitHub OAuth Flow (Recommended)

```
1. User clicks "Sign in with GitHub"
2. Frontend → redirects to:
   https://github.com/login/oauth/authorize?client_id=<CLIENT_ID>&scope=repo

3. GitHub → redirects back to:
   http://localhost:5173/callback?code=<CODE>

4. Frontend → POST /auth/callback { code }
5. Backend → POST https://github.com/login/oauth/access_token { code, client_secret }
6. GitHub → { access_token }
7. Backend → create session (JWT or signed cookie)
8. Backend → return { token } to frontend
9. Frontend stores token in memory / httpOnly cookie

10. All subsequent API calls include:
    Authorization: Bearer <JWT>
```

### 5.2 Protected Endpoint Pattern (FastAPI)

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

def get_current_user(token: str = Depends(security)):
    payload = verify_jwt(token.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@app.post("/analyze")
def analyze_repo(request: AnalyzeRequest, user=Depends(get_current_user)):
    ...
```

---

## 6. Authentication Security Checklist

| Item | Current Status | Recommended |
|------|---------------|------------|
| User identity | None | GitHub OAuth or JWT |
| API key storage | `.env` file | Secret manager (AWS Secrets Manager, GCP Secret Manager) |
| Token in frontend bundle | N/A | Never store secrets client-side |
| HTTPS in production | Not enforced | Enforce via reverse proxy (nginx/Caddy) |
| Rate limiting per user | None | Add per-IP or per-user rate limiter |
| Repo access isolation | None | Namespace `repo_store` by `user_id` |

---

*See [middleware.md](./middleware.md) for how CORS and future auth middleware slot into the request pipeline.*
