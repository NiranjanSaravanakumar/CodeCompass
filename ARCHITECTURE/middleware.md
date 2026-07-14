# CodeCompass — Middleware

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [api-flow.md](./api-flow.md) · [authentication-flow.md](./authentication-flow.md) · [request-lifecycle.md](./request-lifecycle.md)

---

## 1. Overview

Middleware in CodeCompass sits between the raw HTTP request received by Uvicorn and the route handler in `main.py`. Currently, one middleware layer is active — **CORS** — with the FastAPI/Starlette request processing pipeline providing implicit middleware for validation and error handling.

---

## 2. Middleware Stack (Current)

```
Incoming HTTP Request
        │
        ▼
┌───────────────────────────────────────────┐
│           Uvicorn (ASGI Server)           │
│   Handles TCP, HTTP/1.1, HTTP/2           │
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────┐
│         Starlette ASGI Application        │
│   (FastAPI is built on Starlette)         │
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────┐  ← Layer 1
│         CORSMiddleware                    │
│   Allow-Origin: *                         │
│   Allow-Methods: *                        │
│   Allow-Headers: *                        │
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────┐  ← Layer 2 (implicit)
│      Pydantic Request Validation          │
│   Validates request body against model    │
│   Returns 422 on validation failure       │
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────┐
│          Route Handler                    │
│   GET  /         → root()                 │
│   GET  /health   → health()               │
│   POST /analyze  → analyze_repo()         │
│   POST /chat     → chat()                 │
└───────────────────────┬───────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────┐  ← Layer 3 (implicit)
│      Exception Handling                   │
│   HTTPException → JSON error response     │
│   Unhandled exc → 500 Internal Error      │
└───────────────────────┬───────────────────┘
                        │
                        ▼
        HTTP Response to Client
```

---

## 3. CORS Middleware

### Configuration

```python
# backend/main.py

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # All origins allowed
    allow_methods=["*"],    # GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],    # All request headers permitted
)
```

### What CORS Middleware Does

The `CORSMiddleware` intercepts every request and:

1. **Preflight (`OPTIONS`) requests:** Responds immediately with `200 OK` and the appropriate `Access-Control-*` headers — does **not** forward to route handlers.
2. **Simple requests:** Appends CORS response headers to the route handler's response.
3. **Credentialed requests:** Currently unsupported (`allow_credentials` is not set → defaults to `False`).

### CORS Headers Added to Responses

| Header | Current Value | Notes |
|--------|-------------|-------|
| `Access-Control-Allow-Origin` | `*` | Wildcard — any origin |
| `Access-Control-Allow-Methods` | `DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT` | All standard methods |
| `Access-Control-Allow-Headers` | `*` | All headers |
| `Access-Control-Max-Age` | `600` | Preflight cache: 10 minutes |

### Preflight Request Lifecycle

```
Browser (cross-origin POST)
    │
    ├─► OPTIONS /analyze
    │     Origin: http://localhost:5173
    │     Access-Control-Request-Method: POST
    │     Access-Control-Request-Headers: content-type
    │
    │   CORSMiddleware intercepts ──► does NOT call route handler
    │
    └─► 200 OK
          Access-Control-Allow-Origin: *
          Access-Control-Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
          Access-Control-Allow-Headers: *
          Access-Control-Max-Age: 600

Browser caches preflight for 600 seconds, then proceeds with:

    ├─► POST /analyze
    │     Origin: http://localhost:5173
    │     Content-Type: application/json
    │     { "github_url": "..." }
    │
    └─► 200 OK
          Access-Control-Allow-Origin: *
          Content-Type: application/json
          { "repo_id": ..., "onboarding_doc": ... }
```

---

## 4. Implicit Middleware (Starlette / FastAPI Built-ins)

### 4.1 Request Validation (Pydantic)

FastAPI automatically validates every request body against its declared Pydantic model before calling the route handler.

```
POST /analyze  { "github_url": 12345 }
     │
     └─► Pydantic: github_url must be str, got int
           HTTP 422 Unprocessable Entity
           {
             "detail": [
               {
                 "loc": ["body", "github_url"],
                 "msg": "str type expected",
                 "type": "type_error.str"
               }
             ]
           }
```

### 4.2 HTTP Exception Handler

`HTTPException` raised anywhere in a route handler is caught and serialized to JSON automatically:

```python
# Raised in route handler
raise HTTPException(status_code=404, detail="Repo not found. Please analyze first.")

# Becomes:
# HTTP 404 Not Found
# { "detail": "Repo not found. Please analyze first." }
```

### 4.3 Unhandled Exception Handler

Any unhandled Python exception results in:
```
HTTP 500 Internal Server Error
{ "detail": "Internal Server Error" }
```

FastAPI logs the traceback to stderr (Uvicorn stdout when `--reload` is active).

---

## 5. Request / Response Logging

**Current state:** No explicit request logging middleware is configured.

Uvicorn outputs basic access logs to stdout in the format:

```
INFO:     127.0.0.1:54321 - "POST /analyze HTTP/1.1" 200 OK
INFO:     127.0.0.1:54322 - "POST /chat HTTP/1.1" 200 OK
```

### Adding Structured Logging Middleware

To add per-request timing and structured logs, insert before route registration:

```python
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("codecompass")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s → %d (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response

app.add_middleware(LoggingMiddleware)
```

---

## 6. Recommended Middleware for Production

The following middleware should be added before moving to production:

| Middleware | Purpose | Library |
|-----------|---------|---------|
| **HTTPS redirect** | Force HTTP → HTTPS | `starlette.middleware.httpsredirect` |
| **Trusted hosts** | Reject requests with unexpected `Host` header | `starlette.middleware.trustedhost` |
| **Rate limiting** | Prevent API abuse | `slowapi` or custom |
| **Request ID** | Assign unique ID per request for tracing | Custom `BaseHTTPMiddleware` |
| **Auth (JWT)** | Verify bearer tokens | Custom `BaseHTTPMiddleware` or FastAPI `Depends` |
| **Logging** | Structured per-request logs | Custom (see section 5) |
| **Gzip compression** | Compress large responses | `starlette.middleware.gzip` |

### Production CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codecompass.example.com",   # Production frontend
        "http://localhost:5173",              # Local dev only
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)
```

### Rate Limiting Example with `slowapi`

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/analyze")
@limiter.limit("5/minute")          # Max 5 analyses per IP per minute
def analyze_repo(request: Request, body: AnalyzeRequest):
    ...
```

---

## 7. Middleware Execution Order

FastAPI / Starlette applies middleware in **reverse registration order** — the last `add_middleware()` call wraps the outermost layer:

```python
# Registration order:
app.add_middleware(CORSMiddleware, ...)    # registered first → outermost
# (future)
app.add_middleware(RateLimitMiddleware)   # registered second → inner
app.add_middleware(LoggingMiddleware)     # registered last  → innermost

# Execution order on request (outermost to innermost):
#   CORSMiddleware → RateLimitMiddleware → LoggingMiddleware → Route Handler
# Execution order on response (innermost to outermost):
#   Route Handler → LoggingMiddleware → RateLimitMiddleware → CORSMiddleware
```

---

*See [authentication-flow.md](./authentication-flow.md) for how auth middleware would fit into this stack.*
