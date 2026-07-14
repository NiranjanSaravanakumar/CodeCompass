# CodeCompass — API Flow

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [component-diagram.md](./component-diagram.md) · [request-lifecycle.md](./request-lifecycle.md) · [middleware.md](./middleware.md)

---

## 1. Overview

The CodeCompass backend exposes a REST API built with FastAPI. All endpoints use JSON for request and response bodies. This document covers every endpoint: its purpose, request schema, response schema, error cases, and a sequence diagram.

---

## 2. Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:8000` |
| Production | Configured via `VITE_API_BASE` env var |

---

## 3. Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Root welcome message |
| `GET` | `/health` | Health check ping |
| `POST` | `/analyze` | Analyze a GitHub repo and generate onboarding doc |
| `POST` | `/chat` | Ask a question about an analyzed repo |

---

## 4. Endpoint Details

### 4.1 `GET /`

**Purpose:** Welcome endpoint, confirms the API is running.

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "status": "ok",
  "message": "Welcome to the CodeCompass API",
  "version": "1.0.0"
}
```

---

### 4.2 `GET /health`

**Purpose:** Health check for uptime monitors and load balancers.

**Request:** No body required.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "CodeCompass API"
}
```

---

### 4.3 `POST /analyze`

**Purpose:** Fetches a GitHub repository's file tree and key files, then uses Gemini AI to generate a comprehensive onboarding document. Stores the repo context in-memory.

**Request Body (`application/json`):**
```json
{
  "github_url": "https://github.com/owner/repo"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `github_url` | `string` | Yes | Full GitHub repo URL |

**Response `200 OK`:**
```json
{
  "repo_id": "owner/repo",
  "onboarding_doc": "# Project Overview\n\n..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `repo_id` | `string` | Composite key `"owner/repo"` used for subsequent `/chat` calls |
| `onboarding_doc` | `string` | AI-generated Markdown document |

**Error Responses:**

| Status | Trigger | Example Detail |
|--------|---------|----------------|
| `400` | Invalid GitHub URL or private/missing repo | `"Repo not found or is private."` |
| `400` | Bad GitHub Token | `"GitHub authentication failed..."` |
| `500` | GitHub API failure | `"Failed to fetch repo context: ..."` |
| `500` | Gemini API failure | `"Failed to generate onboarding document: ..."` |

**Sequence Diagram:**

```
Frontend          Backend          GitHub API        Gemini API
   │                 │                  │                 │
   │── POST /analyze ─►│                 │                 │
   │                 │── parse_github_url()               │
   │                 │── fetch_default_branch() ──────────►│
   │                 │◄────────────── branch ─────────────│
   │                 │── fetch_repo_tree() ────────────────►│
   │                 │◄──────────── file tree ─────────────│
   │                 │── fetch_file_content() (×N) ────────►│
   │                 │◄─────────── file contents ──────────│
   │                 │── store in repo_store              │
   │                 │── generate_onboarding() ────────────────────────►│
   │                 │                                    │◄── Markdown ─│
   │◄── 200 {repo_id, onboarding_doc} ─│                 │              │
```

---

### 4.4 `POST /chat`

**Purpose:** Answers a developer's question about a previously analyzed repository using the stored repo context and Gemini AI.

**Request Body (`application/json`):**
```json
{
  "repo_id": "owner/repo",
  "question": "How does authentication work in this project?",
  "chat_history": [
    { "role": "user", "content": "What does this project do?" },
    { "role": "assistant", "content": "This project is a..." }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `repo_id` | `string` | Yes | The `repo_id` returned by `/analyze` |
| `question` | `string` | Yes | The developer's question |
| `chat_history` | `array` | No | Previous turns for conversational context |

**`chat_history` item schema:**

| Field | Type | Values |
|-------|------|--------|
| `role` | `string` | `"user"` or `"assistant"` |
| `content` | `string` | The message text |

**Response `200 OK`:**
```json
{
  "answer": "Authentication in this project uses..."
}
```

**Error Responses:**

| Status | Trigger | Example Detail |
|--------|---------|----------------|
| `404` | `repo_id` not found in store | `"Repo not found. Please analyze first."` |
| `500` | Gemini API failure | `"Failed to answer question: ..."` |

**Sequence Diagram:**

```
Frontend          Backend           Gemini API
   │                 │                  │
   │── POST /chat ──►│                  │
   │                 │── lookup repo_store[repo_id]
   │                 │── answer_question()
   │                 │   build system prompt + chat_history + question
   │                 │── model.generate_content() ──────────────────────►│
   │                 │◄────────────────────────────────── answer text ────│
   │◄── 200 {answer} ─│                 │
```

---

## 5. Request / Response Pydantic Models

```python
# main.py

class AnalyzeRequest(BaseModel):
    github_url: str

class ChatRequest(BaseModel):
    repo_id: str
    question: str
    chat_history: list[dict] = []
```

---

## 6. CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)
```

All origins are accepted in the current development configuration. See [middleware.md](./middleware.md) for a full breakdown of middleware behavior.

---

## 7. Gemini AI Prompt Structure

### `/analyze` — Onboarding Prompt

```
System: You are an expert software engineer onboarding a new developer to {owner}/{repo}.

Context provided:
  - Folder structure (up to 100 file paths)
  - Key file contents (up to 20 files, each truncated at 3 000 chars)

Output sections:
  1. Project Overview
  2. Tech Stack
  3. Folder Structure
  4. Key Files
  5. How to Get Started
  6. Architecture Overview

Config: temperature=0.3, max_output_tokens=4096
```

### `/chat` — Q&A Prompt

```
System: You are an expert software engineer familiar with {owner}/{repo}.
  - Folder structure
  - Key file contents

Context: Full chat_history as "role: content" lines
         + current question appended

Config: temperature=0.3, max_output_tokens=2048
```

---

*See [request-lifecycle.md](./request-lifecycle.md) for a complete end-to-end trace of a real user session.*
