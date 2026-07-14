# CodeCompass — Database / Data Storage Flow

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [api-flow.md](./api-flow.md) · [request-lifecycle.md](./request-lifecycle.md)

---

## 1. Overview

CodeCompass **does not use a persistent database** in its current implementation. Repository context is stored in a plain Python dictionary (`repo_store`) in the backend process memory. This document covers:

- The in-memory data store structure and lifecycle
- The data that flows through the system
- Current limitations and a recommended migration path to a persistent store

---

## 2. In-Memory Store (`repo_store`)

### Location

```python
# backend/main.py
repo_store: dict = {}
```

`repo_store` is a module-level dictionary instantiated when the FastAPI process starts. It persists for the lifetime of the server process.

---

## 3. Data Schema

### `repo_store` Key

```
repo_id  →  "owner/repo"   (e.g. "facebook/react")
```

The key is composed by joining the GitHub username and repository name with a `/`.

### `repo_store` Value — `repo_context` Object

```python
{
    "owner":         str,   # GitHub username  (e.g. "facebook")
    "repo":          str,   # Repository name  (e.g. "react")
    "all_paths":     list[str],  # All blob paths in the repo tree (unlimited)
    "file_contents": dict[str, str],  # path → truncated file content (≤20 files)
}
```

#### `all_paths`

- Source: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1`
- Contains every file path (`type == "blob"`) in the repository.
- Used in AI prompts as the folder-structure context (first 100 paths passed to AI).

#### `file_contents`

- Source: `GET https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`
- Only files whose basename matches the `IMPORTANT_FILES` allowlist are fetched.
- Maximum **20 files** fetched per repository.
- Each file content is **truncated at 3 000 characters**.

---

## 4. IMPORTANT_FILES Allowlist

```python
IMPORTANT_FILES = [
    "README.md", "readme.md", "README.rst",
    "main.py", "app.py", "index.py", "server.py", "run.py",
    "main.js", "index.js", "app.js", "server.js",
    "main.ts", "index.ts", "app.ts",
    "package.json", "requirements.txt", "pyproject.toml",
    "docker-compose.yml", "Dockerfile", ".env.example",
    "pom.xml", "build.gradle", "Makefile",
]
```

These are the files most likely to reveal project structure, entry points, and dependency information to the AI.

---

## 5. Data Lifecycle Diagram

```
POST /analyze
     │
     ├─► parse_github_url()       → owner, repo
     ├─► fetch_default_branch()   → branch name
     ├─► fetch_repo_tree()        → all_paths (full tree)
     ├─► fetch_file_content() ×N  → file_contents dict
     │
     ├─► WRITE: repo_store["owner/repo"] = repo_context
     │
     └─► generate_onboarding(repo_context) → onboarding_doc (not stored)


POST /chat
     │
     ├─► READ: repo_store["owner/repo"] → repo_context
     │         (404 if not found)
     │
     └─► answer_question(question, repo_context, chat_history)
         → answer (not stored)


Server Shutdown
     │
     └─► repo_store lost (no persistence)
```

---

## 6. Data Storage Summary

| Data | Where Stored | Persistence | TTL |
|------|-------------|-------------|-----|
| `repo_context` (owner, repo, paths, files) | Python dict in process memory | Process lifetime | Until server restart |
| `onboarding_doc` | Frontend React state (`useState`) | Browser session | Until page reload or Back |
| `chat_history` | Frontend React state (`useState`) | Browser session | Until page reload or Back |
| User theme preference | `localStorage` (key: `cc-theme`) | Browser persistent | Until cleared |
| GitHub API responses | Not cached | None | — |
| Gemini AI responses | Not cached | None | — |

---

## 7. Frontend State (Client-Side Data)

```
App.jsx useState()
│
├── phase            ('landing' | 'loading' | 'result')
├── githubUrl        string — raw URL input
├── repoId           string — "owner/repo" from /analyze response
├── onboardingDoc    string — Markdown from /analyze response
├── error            string | null — last error message
├── chatHistory      array of { role, content } — full conversation
├── question         string — current input field value
├── chatLoading      boolean — waiting for /chat response
└── chatWidth        number (px) — splitter position
```

---

## 8. Current Limitations

| Limitation | Impact | Severity |
|------------|--------|----------|
| No persistence | Repo context lost on server restart | Medium |
| No eviction | `repo_store` grows indefinitely with use | High |
| No deduplication | Same repo re-analyzed creates new duplicate entry | Low |
| No expiry | Stale context served if repo has been updated | Low |
| Single process | Does not scale horizontally (store not shared) | High |

---

## 9. Recommended Migration Path

For production, migrate `repo_store` to a persistent backing store:

### Option A — Redis (Recommended)

```python
import redis, json

r = redis.Redis(host="localhost", port=6379)
TTL_SECONDS = 3600  # 1 hour

# Write
r.setex(repo_id, TTL_SECONDS, json.dumps(repo_context))

# Read
raw = r.get(repo_id)
repo_context = json.loads(raw) if raw else None
```

Pros: Automatic TTL, horizontal scaling, fast reads.

### Option B — SQLite / PostgreSQL

Store `repo_context` as a JSON column with a `created_at` timestamp and periodic cleanup job.

### Option C — File System Cache

Serialize `repo_context` to `{repo_id}.json` files in a temp directory with mtime-based eviction.

---

*See [api-flow.md](./api-flow.md) for the HTTP contracts that read and write this data.*
