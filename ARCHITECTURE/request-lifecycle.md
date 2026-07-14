# CodeCompass — Request Lifecycle

> **Related Documents:**
> [system-architecture.md](./system-architecture.md) · [api-flow.md](./api-flow.md) · [component-diagram.md](./component-diagram.md) · [middleware.md](./middleware.md)

---

## 1. Overview

This document traces the **complete lifecycle of a user session** through CodeCompass — from the initial page load to typing a question in the chat. Each phase covers both frontend state transitions and backend execution paths.

---

## 2. Phase 1 — Page Load

```
Browser
  │
  ├─► Load index.html (served by Vite dev server or static host)
  ├─► Load React bundle (main.jsx → App.jsx)
  ├─► App initializes:
  │     phase        = 'landing'
  │     theme        = getInitialTheme()   (reads localStorage)
  │     chatWidth    = 420
  │     chatHistory  = []
  │
  ├─► useTheme hook runs:
  │     document.documentElement.setAttribute('data-theme', theme)
  │
  └─► Render: <Navbar variant="landing"> + <HeroSection> + landing sections
```

No network requests are made on initial load.

---

## 3. Phase 2 — Repository Analysis (`POST /analyze`)

### 3.1 Frontend: User Triggers Analyze

```
User types GitHub URL in HeroSection input
  │
  ├─► setGithubUrl(url)         [state update → re-render input]
  │
User clicks "Analyze" button (or presses Enter)
  │
  ├─► HeroSection calls onAnalyze(url)
  │
  └─► App.handleAnalyze() runs:
        setError(null)
        setPhase('loading')     ← re-render: show spinner
        axios.post('/analyze', { github_url: url })
```

### 3.2 Browser → Backend: HTTP Request

```
POST http://localhost:8000/analyze
Content-Type: application/json

{
  "github_url": "https://github.com/owner/repo"
}
```

**CORS preflight (if origin differs):**
```
OPTIONS /analyze
Origin: http://localhost:5173
Access-Control-Request-Method: POST
```
FastAPI CORS middleware responds with `200` and the appropriate headers — see [middleware.md](./middleware.md).

### 3.3 Backend: `/analyze` Handler Execution

```
main.py → analyze_repo()
│
├─ 1. Pydantic validates AnalyzeRequest { github_url }
│
├─ 2. github_service.get_repo_context(github_url)
│      │
│      ├─ parse_github_url()
│      │    ├─ Strip "https://github.com/"
│      │    ├─ Split on "/"
│      │    └─ Return (owner, repo)
│      │
│      ├─ fetch_default_branch(owner, repo)
│      │    └─ GET api.github.com/repos/{owner}/{repo}
│      │         Response: { default_branch: "main" }
│      │
│      ├─ fetch_repo_tree(owner, repo)
│      │    └─ GET api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1
│      │         Response: { tree: [ {path, type, sha}, ... ] }
│      │         Filter: type == "blob" only
│      │
│      ├─ Build all_paths = [ item["path"] for item in tree ]
│      │
│      ├─ Filter files_to_fetch:
│      │    For each tree item:
│      │      if basename(path) in IMPORTANT_FILES → include
│      │    Limit to first 20 matches
│      │
│      └─ fetch_file_content() × N  (up to 20 parallel-ish calls)
│           └─ GET raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
│                Truncate content at 3 000 chars
│
├─ 3. Compose repo_id = f"{owner}/{repo}"
│
├─ 4. repo_store[repo_id] = repo_context     (WRITE to in-memory store)
│
└─ 5. gemini_service.generate_onboarding(repo_context)
       │
       ├─ Build prompt string:
       │    - System instruction
       │    - folder_structure = "\n".join(all_paths[:100])
       │    - files_section = "### {path}\n{content}" for each file
       │
       └─ model.generate_content(prompt, temperature=0.3, max_tokens=4096)
            └─ Returns onboarding_doc Markdown string
```

**Timeline (approximate):**

| Step | Duration |
|------|---------|
| GitHub tree fetch | 200–800 ms |
| File content fetches (×N, sequential) | 1–5 s |
| Gemini generation | 3–15 s |
| **Total** | **5–20 s** |

### 3.4 Backend → Frontend: Response

```
HTTP 200 OK
Content-Type: application/json

{
  "repo_id": "owner/repo",
  "onboarding_doc": "# Project Overview\n\n..."
}
```

### 3.5 Frontend: Handling the Response

```
axios.post response arrives
  │
  ├─ setRepoId("owner/repo")
  ├─ setOnboardingDoc("# Project Overview...")
  ├─ setChatHistory([])
  ├─ setQuestion('')
  └─ setPhase('result')    ← re-render: result view
       │
       ├─ Navbar (compact, shows repo pill)
       ├─ DocPanel (renders onboardingDoc as Markdown)
       ├─ Splitter
       └─ ChatPanel (empty state, shows suggestions)
```

**On error:**
```
catch (err)
  │
  ├─ setError(err.response?.data?.detail ?? 'Something went wrong...')
  └─ setPhase('landing')   ← re-render: back to landing with error message
```

---

## 4. Phase 3 — Chat Interaction (`POST /chat`)

### 4.1 Frontend: User Sends Message

```
User types question in ChatPanel input
  │
  ├─► setQuestion(text)

User presses Enter or clicks Send
  │
  ├─► ChatPanel.handleKeyDown() → onChat(question)
  │
  └─► App.handleChat(message) runs:
        newHistory = [...chatHistory, { role: 'user', content: msg }]
        setChatHistory(newHistory)   ← optimistic: shows user msg immediately
        setQuestion('')
        setChatLoading(true)
        axios.post('/chat', { repo_id, question: msg, chat_history: chatHistory })
```

### 4.2 Browser → Backend: HTTP Request

```
POST http://localhost:8000/chat
Content-Type: application/json

{
  "repo_id":      "owner/repo",
  "question":     "How does the GitHub integration work?",
  "chat_history": [
    { "role": "user",      "content": "What does this project do?" },
    { "role": "assistant", "content": "CodeCompass is a tool that..." }
  ]
}
```

### 4.3 Backend: `/chat` Handler Execution

```
main.py → chat()
│
├─ 1. Pydantic validates ChatRequest
│
├─ 2. repo_context = repo_store.get(repo_id)
│      └─ None? → HTTP 404 "Repo not found. Please analyze first."
│
└─ 3. gemini_service.answer_question(question, repo_context, chat_history)
       │
       ├─ Build system_prompt (owner/repo + folder_structure + files)
       ├─ messages = [
       │     { "role": "system", "content": system_prompt },
       │     ...chat_history,
       │     { "role": "user", "content": question }
       │   ]
       ├─ prompt = "\n".join(f"{item['role']}: {item['content']}" for item in messages)
       └─ model.generate_content(prompt, temperature=0.3, max_tokens=2048)
```

### 4.4 Frontend: Handling the Chat Response

```
axios.post response arrives
  │
  ├─ setChatHistory([...newHistory, { role: 'assistant', content: answer }])
  └─ setChatLoading(false)
       │
       ChatPanel re-renders:
         - Shows AI answer bubble
         - Typing indicator disappears
         - Auto-scrolls to bottom (useEffect on chatHistory)
```

**On error:**
```
catch (err)
  │
  ├─ setChatHistory([...newHistory, {
  │     role: 'assistant',
  │     content: `⚠️ ${detail}`
  │   }])
  └─ setChatLoading(false)
```

---

## 5. Phase 4 — Back Navigation

```
User clicks "← Dashboard" in Navbar
  │
  └─► App.handleBack()
        setPhase('landing')
        setRepoId(null)
        setOnboardingDoc('')
        setChatHistory([])
        setQuestion('')
        setError(null)
        ← re-render: landing page
           NOTE: repo_store on backend is NOT cleared
```

---

## 6. Splitter Drag Lifecycle

```
User presses mouse button on Splitter
  │
  └─► onSplitterMouseDown(e)
        isDragging.current     = true
        startX.current         = e.clientX
        startChatWidth.current = chatWidth
        document.body.style.cursor = 'col-resize'

During drag (window mousemove)
  │
  └─► onMouseMove(e)
        delta  = startX - e.clientX     (drag left → chat grows)
        newW   = clamp(MIN_CHAT_WIDTH, startChatWidth + delta,
                       containerWidth - MIN_DOC_WIDTH)
        setChatWidth(newW)               ← re-renders ChatPanel width

Mouse released (window mouseup)
  │
  └─► onMouseUp()
        isDragging.current         = false
        document.body.style.cursor = ''
```

**Constraints:**
- `MIN_CHAT_WIDTH = 260 px`
- `MIN_DOC_WIDTH  = 280 px`

---

## 7. Full Session Sequence Diagram

```
User       Frontend      Backend     GitHub API    Gemini AI
 │             │             │            │             │
 │─ open URL ──►│             │            │             │
 │             │─ render landing           │             │
 │─ type URL ──►│             │            │             │
 │─ click Analyze ►│           │            │             │
 │             │─ POST /analyze ►│           │             │
 │             │             │─ GET tree ──►│             │
 │             │             │◄── tree ────│             │
 │             │             │─ GET files (×N) ─────────►│
 │             │             │◄── contents ─────────────│
 │             │             │─ generate_onboarding() ──────────────────►│
 │             │             │◄──────────── onboarding Markdown ──────────│
 │             │◄── 200 ────│             │             │
 │             │─ render result view       │             │
 │─ type question ►│          │            │             │
 │─ press Enter ──►│          │            │             │
 │             │─ POST /chat ──►│           │             │
 │             │             │─ answer_question() ────────────────────────►│
 │             │             │◄────────────────── answer ─────────────────│
 │             │◄── 200 ────│             │             │
 │             │─ render answer bubble     │             │
 │◄ sees answer ─│            │            │             │
```

---

*See [api-flow.md](./api-flow.md) for the JSON schemas of each HTTP call shown above.*
