# 🗄️ Caching Strategy for CodeCompass — Reduce API Costs

## The Problem (Right Now)

Every time a user analyzes the **same GitHub repo**, your app:
1. Calls GitHub API to fetch files (slow, rate-limited)
2. Calls **Groq AI** to generate the onboarding doc (costs tokens 💸)
3. For every chat question, **resends the entire codebase** as a system prompt (massive token waste!)

```
User A → analyze "facebook/react" → Groq API called (1500 tokens)
User B → analyze "facebook/react" → Groq API called AGAIN (1500 tokens) ← Wasted!
```

---

## Two Types of Cache We'll Add

| Cache | What it stores | Where |
|---|---|---|
| **Repo Cache** | Onboarding doc per repo (GitHub URL → AI doc) | Server memory (dict) |
| **Response Cache** | AI chat answers per (repo + question) | Server memory (dict) |

> [!NOTE]
> Both caches are in-memory for now. This means they reset when the server restarts.
> For persistent caching across restarts, you'd use a file-based cache or Redis.

---

## How It Works — Step by Step

### 1. Onboarding Cache (`/analyze` endpoint)

```
Request: analyze "github.com/facebook/react"
         ↓
Check cache: Is "facebook/react" already in cache?
   YES → Return cached onboarding doc instantly ✅ (0 tokens used!)
   NO  → Call Groq API → Store result in cache → Return result
```

### 2. Chat Answer Cache (`/chat` endpoint)

```
Request: ask "What does this project do?" about "facebook/react"
         ↓
Create cache key: hash(repo_id + question)
         ↓
Check cache: Is this exact question cached?
   YES → Return cached answer instantly ✅ (0 tokens used!)
   NO  → Call Groq API → Store result in cache → Return result
```

---

## The Code Changes

### `cache_service.py` (NEW FILE)

```python
import hashlib
from datetime import datetime, timedelta

class CacheService:
    def __init__(self, ttl_hours: int = 24):
        self._onboarding_cache: dict = {}   # repo_id → onboarding doc
        self._chat_cache: dict = {}          # hash(repo+question) → answer
        self.ttl = timedelta(hours=ttl_hours)

    def _is_expired(self, timestamp: datetime) -> bool:
        return datetime.now() - timestamp > self.ttl

    # --- Onboarding Cache ---
    def get_onboarding(self, repo_id: str) -> str | None:
        entry = self._onboarding_cache.get(repo_id)
        if entry and not self._is_expired(entry["time"]):
            return entry["doc"]
        return None

    def set_onboarding(self, repo_id: str, doc: str):
        self._onboarding_cache[repo_id] = {"doc": doc, "time": datetime.now()}

    # --- Chat Cache ---
    def get_chat(self, repo_id: str, question: str) -> str | None:
        key = hashlib.md5(f"{repo_id}:{question}".encode()).hexdigest()
        entry = self._chat_cache.get(key)
        if entry and not self._is_expired(entry["time"]):
            return entry["answer"]
        return None

    def set_chat(self, repo_id: str, question: str, answer: str):
        key = hashlib.md5(f"{repo_id}:{question}".encode()).hexdigest()
        self._chat_cache[key] = {"answer": answer, "time": datetime.now()}

    def get_stats(self) -> dict:
        return {
            "onboarding_cached": len(self._onboarding_cache),
            "chat_answers_cached": len(self._chat_cache)
        }

cache = CacheService(ttl_hours=24)  # Cache expires after 24 hours
```

### Changes to `main.py`

```python
# Add at top
from cache_service import cache

@app.post("/analyze")
def analyze_repo(request: AnalyzeRequest):
    repo_context = get_repo_context(request.github_url)
    repo_id = f"{repo_context['owner']}/{repo_context['repo']}"
    repo_store[repo_id] = repo_context

    # ✅ Check cache BEFORE calling Groq
    cached_doc = cache.get_onboarding(repo_id)
    if cached_doc:
        return {"repo_id": repo_id, "onboarding_doc": cached_doc, "from_cache": True}

    # Cache miss → call AI
    onboarding_doc = generate_onboarding(repo_context)
    cache.set_onboarding(repo_id, onboarding_doc)   # ✅ Store in cache
    return {"repo_id": repo_id, "onboarding_doc": onboarding_doc, "from_cache": False}


@app.post("/chat")
def chat(request: ChatRequest):
    repo_context = repo_store.get(request.repo_id)

    # ✅ Check cache BEFORE calling Groq
    cached_answer = cache.get_chat(request.repo_id, request.question)
    if cached_answer:
        return {"answer": cached_answer, "from_cache": True}

    # Cache miss → call AI
    answer = answer_question(request.question, repo_context, request.chat_history)
    cache.set_chat(request.repo_id, request.question, answer)  # ✅ Store in cache
    return {"answer": answer, "from_cache": False}


# ✅ New endpoint to see cache stats
@app.get("/cache/stats")
def cache_stats():
    return cache.get_stats()
```

---

## Token Savings Estimate

| Scenario | Without Cache | With Cache |
|---|---|---|
| 10 users analyze same repo | 10 × ~1500 tokens = 15,000 tokens | 1 × 1500 = **1,500 tokens** |
| Same question asked 5 times | 5 × ~500 tokens = 2,500 tokens | 1 × 500 = **500 tokens** |
| **Savings** | — | **~90% reduction** |

---

## Cache Expiry (TTL)

The cache automatically expires entries after **24 hours** using a TTL (Time To Live):

```
Entry created at 10:00 AM
TTL = 24 hours
Entry expires at 10:00 AM next day → Fresh API call made again
```

This ensures you always serve **fresh data** while still saving costs on repeated requests within the same day.

---

## Advanced Options (Future)

| Option | When to use |
|---|---|
| **Redis** | Multiple server instances / production scale |
| **SQLite** | Persistent cache that survives server restarts |
| **functools.lru_cache** | Simple function-level memoization |
| **Groq's native prompt caching** | Groq auto-caches system prompts — huge savings! |

> [!TIP]
> **Groq has built-in prompt caching!** If you prefix your system prompt consistently,
> Groq may automatically cache it on their end. Check your Groq dashboard for cache hits.

