# ⚙️ CodeCompass — Backend

FastAPI server. Handles GitHub fetching, Groq AI generation, and in-memory caching.

---

## Quick Start

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Create `.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
GITHUB_TOKEN=your_github_token_here   # optional
```

---

## Tech Stack

| Library | Version | Role |
|---|---|---|
| FastAPI | 0.135+ | REST framework |
| uvicorn | 0.44+ | ASGI server |
| groq | 1.5.0 | Groq LLaMA 3.3 70B |
| requests | 2.33+ | GitHub API HTTP calls |
| python-dotenv | 1.2+ | `.env` loading |
| pydantic | 2.x | Request/response validation |

---

## File Reference

| File | Responsibility |
|---|---|
| `main.py` | FastAPI app, route definitions, cache wiring |
| `github_service.py` | Parse GitHub URLs, fetch repo tree + file contents |
| `groq_service.py` | Build prompts, call Groq API, return AI text |
| `cache_service.py` | In-memory TTL cache for onboarding docs and chat answers |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Root / version check |
| `GET` | `/health` | Health check |
| `POST` | `/analyze` | Fetch repo + generate onboarding doc |
| `POST` | `/chat` | Answer a question about the repo |
| `GET` | `/cache/stats` | Active cache entry counts |
| `POST` | `/cache/clear` | Flush all cached data |

---

## Caching

`cache_service.py` implements a **two-layer in-memory cache** with a 24-hour TTL:

```
Layer 1 — Onboarding cache
  key:   repo_id  (e.g. "facebook/react")
  value: { doc: "...", time: datetime }

Layer 2 — Chat answer cache
  key:   md5(repo_id + question.strip().lower())
  value: { answer: "...", time: datetime }
```

### How expiry works

```python
def _is_expired(self, timestamp):
    return datetime.now() - timestamp > self.ttl  # ttl = 24h
```

Every `get_*` call checks expiry before returning. Expired entries are silently ignored and overwritten on the next API call.

### Big O Analysis

| Operation | Time | Space |
|---|---|---|
| `get_onboarding(repo_id)` | **O(1)** — dict key lookup | O(1) |
| `set_onboarding(repo_id, doc)` | **O(1)** — dict write | O(n) total |
| `get_chat(repo_id, question)` | **O(1)** — md5 hash + dict lookup | O(1) |
| `set_chat(repo_id, question, answer)` | **O(1)** — md5 hash + dict write | O(n) total |
| `get_stats()` | **O(n)** — iterates all entries to count active | O(1) |
| `clear()` | **O(n)** — clears both dicts | O(1) |

Where `n` = number of cached entries. In practice `n` is very small (one entry per unique repo/question).

---

## Token Optimisation

Every `/analyze` call minimises tokens sent to Groq:

| Strategy | Setting | Saving |
|---|---|---|
| File count | Max 8 files (was 20) | ~-60% |
| File content | Max 1,200 chars/file (was 3,000) | ~-60% per file |
| Folder paths | 40 paths sent (was 100) | ~-60 lines |
| Output limit | `max_tokens=2048` (was 4,096) | ~-50% |
| **Total combined** | — | **~75% fewer tokens** |

Files are fetched by priority:

```
Tier 1 (always): README.md, package.json, requirements.txt, pyproject.toml
Tier 2 (entry):  main.py, app.py, index.js, main.ts …
Tier 3 (build):  Dockerfile, docker-compose.yml, Makefile …
```

---

## GitHub Service — Big O

`github_service.py` fetches the repo tree and selected file contents.

| Operation | Time | Notes |
|---|---|---|
| `parse_github_url(url)` | O(1) | String split on `/` |
| `fetch_repo_tree(owner, repo)` | O(t) | t = total files in repo tree (network bound) |
| `get_repo_context(url)` — priority sort | O(f log f) | f = matched important files (≤ 8) |
| `fetch_file_content(...)` × 8 files | O(8) = O(1) | Constant — capped at MAX_FILES |
| Full `get_repo_context` end-to-end | **O(t)** | Dominated by tree fetch |

`t` is bounded by GitHub's API response size, not our code.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | From [console.groq.com](https://console.groq.com) |
| `GITHUB_TOKEN` | Optional | Raises rate limit from 60 → 5,000 req/hr |

---

## Development Tips

- **Auto-reload** — `--reload` flag watches for file changes. Save any `.py` file → server restarts instantly.
- **Swagger UI** — Visit `http://localhost:8000/docs` to explore and test all endpoints interactively.
- **Cache during dev** — Use `POST /cache/clear` to force a fresh Groq call when testing prompts.
- **Token cost** — Check your [Groq dashboard](https://console.groq.com) for real token usage after each test.
- **VS Code interpreter** — Select `.venv\Scripts\python.exe` as your Python interpreter to resolve import errors like `from groq import Groq`.
