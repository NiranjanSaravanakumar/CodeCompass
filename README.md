# CodeCompass (Codebase Onboarder)

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

> Paste a GitHub repository URL and instantly get an AI-generated onboarding guide — plus a chat interface to ask questions about that codebase.


---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Installation Guide](#2-installation-guide)
3. [Clone the Repository](#3-clone-the-repository)
4. [Git Setup](#4-git-setup)
5. [Dependency Installation](#5-dependency-installation)
6. [Environment Variables](#6-environment-variables)
7. [Running the Project](#7-running-the-project)
8. [Complete Folder Structure](#8-complete-folder-structure)
9. [Component Documentation](#9-component-documentation)
10. [API Documentation](#10-api-documentation)
11. [Backend Explanation](#11-backend-explanation)
12. [Database Documentation](#12-database-documentation)
13. [Configuration Files](#13-configuration-files)
14. [Scripts](#14-scripts)
15. [Assets](#15-assets)
16. [Deployment](#16-deployment)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Project Overview

### Project Name

**CodeCompass** — displayed in the browser tab title. The UI branding uses **Codebase Onboarder**.

### What Problem It Solves

Onboarding to a new codebase is slow. Developers must manually read README files, explore folder structures, and trace entry points before they can contribute. CodeCompass automates the first pass:

1. You paste a **public GitHub repository URL**.
2. The backend fetches the repo tree and key files via the **GitHub API**.
3. **Google Gemini** generates a structured onboarding document.
4. You can **chat** with an AI assistant that has context about that repository.

### Features

| Feature | Description |
|---------|-------------|
| GitHub URL analysis | Accepts `https://github.com/owner/repo` (`.git` suffix is stripped automatically) |
| Smart file fetching | Pulls important files (`README.md`, `package.json`, `requirements.txt`, entry points, etc.) |
| AI onboarding doc | Generates overview, tech stack, folder structure, setup steps, and architecture sections |
| Interactive chat | Ask follow-up questions about the analyzed repository |
| Split-panel UI | Onboarding doc on the left, chat on the right |
| Markdown rendering | Docs and chat responses render as formatted Markdown |

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 | UI components and state |
| | Vite 8 | Dev server, bundler, HMR |
| | Axios | HTTP requests to the backend |
| | react-markdown | Renders AI-generated Markdown |
| **Backend** | Python 3.10+ | Server runtime |
| | FastAPI | REST API framework |
| | Uvicorn | ASGI server |
| | Pydantic | Request/response validation |
| | python-dotenv | Loads `.env` secrets |
| | requests | Calls GitHub REST/raw APIs |
| | google-generativeai | Calls Google Gemini API |
| **External APIs** | GitHub API | Repository tree, metadata, file content |
| | Google Gemini (`gemini-2.5-flash`) | Onboarding doc + chat generation |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React + Vite)                   │
│  App.jsx  ──POST /analyze──►  FastAPI (main.py)                 │
│           ◄── onboarding_doc ──                                 │
│           ──POST /chat──────►  FastAPI                          │
│           ◄── answer ──────────                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
     github_service.py                  gemini_service.py
     (GitHub API)                       (Gemini API)
                │                               │
                └─────────── repo_context ──────┘
                            (in-memory store)
```

**Request flow for `/analyze`:**

1. Frontend sends `{ github_url }` to the backend.
2. `github_service.get_repo_context()` parses the URL, fetches the file tree, reads up to 20 important files, and returns a context object.
3. Context is stored in an in-memory dictionary (`repo_store`) keyed by `owner/repo`.
4. `gemini_service.generate_onboarding()` sends the context to Gemini and returns Markdown text.
5. Frontend displays the doc and enables chat.

**Request flow for `/chat`:**

1. Frontend sends `{ repo_id, question, chat_history }`.
2. Backend looks up cached context from `repo_store`.
3. `gemini_service.answer_question()` builds a prompt with repo files + chat history.
4. Gemini returns an answer; frontend appends it to the chat.

### Folder Structure (High Level)

```
CodeCompass/
├── backend/           # Python FastAPI server
│   ├── main.py        # API routes and app setup
│   ├── github_service.py
│   ├── gemini_service.py
│   └── requirements.txt
├── frontend/          # React + Vite client
│   ├── src/
│   │   ├── App.jsx    # Main (and only) UI component
│   │   ├── App.css
│   │   ├── main.jsx   # React entry point
│   │   └── index.css
│   ├── public/        # Static assets
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

> **Note:** The root-level `requirements.txt` is **not** used by this project. Backend dependencies live in `backend/requirements.txt`.

---

## 2. Installation Guide

These steps assume a **fresh Windows, macOS, or Linux machine** with internet access.

### Prerequisites

| Software | Minimum Version | Required For |
|----------|-----------------|--------------|
| **Git** | 2.30+ | Cloning and version control |
| **Node.js** | 18+ (20 LTS recommended) | Frontend (npm, Vite) |
| **Python** | 3.10+ | Backend (FastAPI) |
| **GitHub account** | — | Optional token for higher API rate limits / private repos |
| **Google AI Studio account** | — | Gemini API key (required) |

This project does **not** use Java, a database, Docker, or pnpm/yarn by default.

---

### Install Git

**Windows:** Download from [git-scm.com](https://git-scm.com/) and run the installer.

**macOS:**
```bash
brew install git
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt update && sudo apt install git
```

Verify:
```bash
git --version
```

---

### Install Node.js and npm

Node.js includes **npm** (Node Package Manager).

**Windows / macOS:** Download the **LTS** installer from [nodejs.org](https://nodejs.org/).

**Linux (using NodeSource for Node 20):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:
```bash
node --version   # e.g. v20.x.x
npm --version    # e.g. 10.x.x
```

**What is npm?**  
npm downloads JavaScript packages listed in `package.json` into a local `node_modules/` folder.

---

### Install Python

**Windows:** Download from [python.org](https://www.python.org/downloads/). Check **"Add Python to PATH"** during install.

**macOS:**
```bash
brew install python
```

**Linux:**
```bash
sudo apt update && sudo apt install python3 python3-venv python3-pip
```

Verify:
```bash
python --version   # or python3 --version
```

---

## 3. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/YOUR_USERNAME/CodeCompass.git
```

| Command | What it does |
|---------|--------------|
| `git clone <url>` | Downloads a full copy of the repository (all files and Git history) from GitHub to your machine. Creates a folder named after the repo. |

```bash
cd CodeCompass
```

| Command | What it does |
|---------|--------------|
| `cd CodeCompass` | Changes your terminal's current directory into the project folder. All following commands run relative to this path. |

**Optional — switch to a specific branch:**
```bash
git checkout main
```
| Command | What it does |
|---------|--------------|
| `git checkout main` | Switches to the `main` branch. Use this if you cloned a repo with multiple branches and want a specific one. |

**Optional — get latest changes:**
```bash
git pull
```
| Command | What it does |
|---------|--------------|
| `git pull` | Fetches new commits from the remote repository and merges them into your current branch. Run this to stay up to date with teammates. |

---

## 4. Git Setup

A beginner-friendly reference for the Git commands you will use while working on this project.

| Command | What it does |
|---------|--------------|
| `git init` | Creates a new empty Git repository in the current folder. **Not needed** after `git clone` — cloning already initializes Git history. |
| `git remote add origin <url>` | Links your local repo to a GitHub remote named `origin`. Used when you create a repo locally first, then push it to GitHub. |
| `git status` | Shows which files are modified, staged, or untracked. Run this often before committing. |
| `git add .` | Stages **all** changed files for the next commit. |
| `git add <file>` | Stages a single file. |
| `git commit -m "message"` | Saves a snapshot of staged changes with a descriptive message. |
| `git push origin main` | Uploads your local commits to GitHub on the `main` branch. |
| `git branch feature-name` | Creates a new branch for isolated work (e.g. a bug fix or feature). |
| `git checkout feature-name` | Switches to that branch. |
| `git switch -c feature-name` | Modern shortcut: create **and** switch to a new branch. |
| `git pull origin main` | Downloads and merges remote changes into your current branch. |
| `git merge feature-name` | Combines another branch's commits into your current branch. |
| **Conflict resolution** | If two people edit the same lines, Git marks conflicts in the file. Open the file, choose which changes to keep, remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), then `git add` and `git commit`. |

### Typical workflow

```bash
git pull                    # 1. Get latest code
git switch -c my-feature    # 2. Create a branch
# ... make changes ...
git status                  # 3. Review changes
git add .                   # 4. Stage changes
git commit -m "Add feature" # 5. Commit
git push -u origin my-feature  # 6. Push branch and open a PR on GitHub
```

---

## 5. Dependency Installation

### Backend (Python)

```bash
cd backend
python -m venv .venv
```

| Step | What happens internally |
|------|-------------------------|
| `python -m venv .venv` | Creates an isolated Python environment in `.venv/`. Project packages are installed here instead of globally, avoiding version conflicts. |

**Activate the virtual environment:**

Windows (PowerShell):
```powershell
.\.venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

| Command | What happens internally |
|---------|-------------------------|
| `pip install -r requirements.txt` | Reads each line in `requirements.txt`, downloads matching packages from PyPI, and installs them into `.venv/`. |

---

### Backend Python Dependencies

| Package | Why it is used |
|---------|----------------|
| **fastapi** | Web framework for defining REST API routes (`/analyze`, `/chat`) |
| **uvicorn** | ASGI server that runs the FastAPI app |
| **pydantic** | Validates request bodies (`AnalyzeRequest`, `ChatRequest`) |
| **python-dotenv** | Loads `GEMINI_API_KEY` and `GITHUB_TOKEN` from `.env` |
| **requests** | HTTP client for GitHub API and raw file URLs |
| **google-generativeai** | Official SDK for Google Gemini text generation |
| **starlette** | Underlying ASGI toolkit used by FastAPI (middleware, HTTP) |
| **httpx / httpcore / h11** | HTTP stack dependencies (used transitively) |
| **annotated-types / typing_extensions** | Type hint support for Pydantic |
| **click** | CLI utilities (used by Uvicorn) |
| **certifi** | SSL certificate bundle for secure HTTPS |
| **anthropic** | Listed in lock file but **not imported** in current source code |

---

### Frontend (Node.js)

```bash
cd frontend
npm install
```

| Command | What happens internally |
|---------|-------------------------|
| `npm install` | Reads `package.json` and `package-lock.json`, resolves exact versions, downloads packages into `node_modules/`, and may update the lock file if needed. |

| Concept | Explanation |
|---------|-------------|
| **package.json** | Declares project name, scripts, and dependency version ranges. |
| **package-lock.json** | Locks exact installed versions so every developer gets identical dependencies. |
| **node_modules/** | Folder where npm stores all downloaded packages. Never commit this folder. |

Install a single package (example):
```bash
npm install axios
```
Adds `axios` to `dependencies` in `package.json` and installs it locally.

---

### Frontend npm Dependencies

#### Production (`dependencies`)

| Package | Why it is used |
|---------|----------------|
| **react** | UI library — components, state, hooks |
| **react-dom** | Renders React components into the browser DOM |
| **axios** | Sends HTTP POST requests to the FastAPI backend |
| **react-markdown** | Converts AI-generated Markdown strings into HTML in the UI |

#### Development (`devDependencies`)

| Package | Why it is used |
|---------|----------------|
| **vite** | Dev server with Hot Module Replacement (HMR) and production bundler |
| **@vitejs/plugin-react** | Enables React JSX/ Fast Refresh in Vite |
| **eslint** | Lints JavaScript/JSX for errors and bad patterns |
| **@eslint/js** | Base ESLint recommended rules |
| **eslint-plugin-react-hooks** | Enforces Rules of Hooks |
| **eslint-plugin-react-refresh** | Validates React Fast Refresh compatibility |
| **globals** | Browser global variables for ESLint |
| **@types/react / @types/react-dom** | TypeScript type definitions (for editor IntelliSense; project uses `.jsx`, not `.tsx`) |

---

## 6. Environment Variables

### Backend — `backend/.env`

Create this file manually (it is git-ignored):

```env
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

| Variable | Required | Used in | Purpose |
|----------|----------|---------|---------|
| `GEMINI_API_KEY` | **Yes** | `gemini_service.py` | Authenticates with Google Gemini. Without it, onboarding and chat will fail with `GEMINI_API_KEY is not set`. |
| `GITHUB_TOKEN` | No (recommended) | `github_service.py` | GitHub Personal Access Token. Increases API rate limits and enables private repo access. If invalid, the app falls back to unauthenticated requests for **public** repos. |

**How to get keys:**

- **Gemini:** [Google AI Studio](https://aistudio.google.com/apikey) → Create API key
- **GitHub:** [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) → `public_repo` scope is enough for public repositories

---

### Frontend — `frontend/.env`

Create this file for non-default API URLs:

```env
VITE_API_BASE=http://localhost:8000
```

| Variable | Required | Used in | Purpose |
|----------|----------|---------|---------|
| `VITE_API_BASE` | No | `App.jsx` | Base URL of the FastAPI backend. Defaults to `http://localhost:8000` if unset. |

> **Vite rule:** Only variables prefixed with `VITE_` are exposed to frontend code via `import.meta.env`.

### `.env` vs `.env.local`

| File | Purpose |
|------|---------|
| `.env` | Default environment values (often committed as `.env.example`) |
| `.env.local` | Local overrides, git-ignored by Vite template — use for secrets on your machine |

This project git-ignores `.env` files. Never commit API keys.

---

## 7. Running the Project

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend
.\.venv\Scripts\Activate.ps1    # Windows PowerShell
# source .venv/bin/activate       # macOS/Linux
uvicorn main:app --reload --port 8000
```

| Command | What it does |
|---------|--------------|
| `uvicorn main:app --reload --port 8000` | Starts the FastAPI app defined in `main.py` as `app`, watches for file changes (`--reload`), and listens on port **8000**. |

Verify: open [http://localhost:8000](http://localhost:8000) — you should see a JSON welcome message.  
Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

| Script | What it does |
|--------|--------------|
| `npm run dev` | Starts the Vite development server (default: [http://localhost:5173](http://localhost:5173)) with hot reload. Edit React files and see changes instantly. |
| `npm run build` | Bundles the app for production into `frontend/dist/`. Minifies and optimizes assets. |
| `npm run preview` | Serves the production build locally so you can test before deploying. Run **after** `npm run build`. |
| `npm run lint` | Runs ESLint across the project to catch code quality issues. |

> This project does **not** define `npm start`. Use `npm run dev` for development.

### Usage

1. Open [http://localhost:5173](http://localhost:5173)
2. Paste a public GitHub URL (e.g. `https://github.com/facebook/react`)
3. Click **Analyze** and wait for the onboarding document
4. Use the chat panel to ask follow-up questions

### Screenshots

| Screen | Description |
|--------|-------------|
| _[Screenshot: Input screen]_ | Hero page with GitHub URL input and Analyze button |
| _[Screenshot: Result screen]_ | Split view — onboarding doc (left) + chat (right) |

---

## 8. Complete Folder Structure

```
CodeCompass/
│
├── backend/
│   ├── main.py                 # FastAPI app, routes, CORS, in-memory repo store
│   ├── github_service.py       # GitHub URL parsing, tree fetch, file content
│   ├── gemini_service.py       # Gemini prompts for onboarding + chat
│   ├── requirements.txt        # Python dependencies (use this, not root file)
│   └── .env                    # Secrets (create locally, not committed)
│
├── frontend/
│   ├── public/
│   │   └── icons.svg           # SVG icon sprite (social/docs icons)
│   ├── src/
│   │   ├── main.jsx            # React DOM entry — mounts <App />
│   │   ├── App.jsx             # Entire application UI and logic
│   │   ├── App.css             # All component styles (dark theme)
│   │   └── index.css           # Minimal global reset
│   ├── index.html              # HTML shell, loads main.jsx
│   ├── package.json            # npm scripts and dependencies
│   ├── package-lock.json       # Locked dependency versions
│   ├── vite.config.js          # Vite + React plugin config
│   ├── eslint.config.js        # ESLint flat config
│   ├── .env.example            # Example env file (update to VITE_API_BASE)
│   └── .gitignore              # Ignores node_modules, dist, .env
│
├── .gitignore                  # Root ignores: .env, venv, node_modules
├── requirements.txt            # ⚠ Not used by this app (system-level dump)
└── README.md                   # This file
```

### Why each part exists

| Path | Role |
|------|------|
| `backend/` | All server-side logic — no separate controllers/models folders; services are plain Python modules |
| `frontend/src/` | All React source code (single-component architecture) |
| `frontend/public/` | Static files served as-is by Vite (not processed by the bundler) |
| `.gitignore` | Prevents secrets and generated folders from being committed |

There is **no** `components/`, `hooks/`, `pages/`, `api/` folder on the frontend — everything lives in `App.jsx` by design for this MVP.

---

## 9. Component Documentation

This project has **one React component**: `App`. The entry file `main.jsx` is not a component — it bootstraps React.

### `main.jsx`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Mount the React app into `#root` in `index.html` |
| **Wraps** | `<App />` inside `<StrictMode>` (double-invokes effects in dev to catch bugs) |
| **Imports** | `index.css` (global styles), `App.jsx` |

---

### `App.jsx`

| Aspect | Detail |
|--------|--------|
| **Purpose** | Full application: URL input, analyze flow, onboarding doc display, chat UI |
| **Props** | None (root component) |
| **Parent** | Rendered by `main.jsx` |
| **Children** | None — no sub-components extracted |

#### State

| State variable | Type | Purpose |
|----------------|------|---------|
| `phase` | `'input' \| 'loading' \| 'result'` | Controls which UI screen is shown |
| `githubUrl` | `string` | User-entered GitHub repository URL |
| `repoId` | `string \| null` | `owner/repo` identifier returned by the API |
| `onboardingDoc` | `string` | Markdown onboarding document from `/analyze` |
| `chatHistory` | `{ role, content }[]` | Conversation messages (`user` / `assistant`) |
| `question` | `string` | Current chat input value |
| `chatLoading` | `boolean` | Disables chat input while waiting for AI |
| `error` | `string \| null` | Error message from failed analyze request |

#### Refs

| Ref | Purpose |
|-----|---------|
| `chatBottomRef` | Scrolls chat to the latest message when history updates |

#### Hooks

| Hook | Usage |
|------|-------|
| `useState` | All UI state listed above |
| `useRef` | Chat scroll anchor |
| `useEffect` | Auto-scroll when `chatHistory` or `chatLoading` changes |

#### Key Functions

| Function | Trigger | API call |
|----------|---------|----------|
| `handleAnalyze()` | Analyze button / Enter in URL input | `POST ${API_BASE}/analyze` with `{ github_url }` |
| `handleChat()` | Send button / Enter in chat input | `POST ${API_BASE}/chat` with `{ repo_id, question, chat_history }` |

#### UI Phases

1. **`input` / `loading`** — Centered hero with URL input, Analyze button, spinner, and error text.
2. **`result`** — Two-panel layout:
   - **Left (`doc-panel`):** Repo pill, "New Repo" button, Markdown onboarding doc
   - **Right (`chat-panel`):** Chat history, typing indicator, question input

#### Dependencies

| Import | Role |
|--------|------|
| `react` | Hooks and JSX |
| `react-markdown` | Renders `onboardingDoc` and chat messages |
| `axios` | HTTP client |
| `./App.css` | Component styles |

#### Styling Approach

- **Plain CSS** in `App.css` — no Tailwind, CSS Modules, or styled-components
- Dark theme (`#0d0f14` background, indigo/purple accents)
- CSS classes: BEM-like naming (`.chat-panel`, `.onboarding-doc`, `.analyze-btn`)
- Markdown-specific styles nested under `.onboarding-doc` and `.msg-content`

#### Best Practices Used

- Controlled inputs (`value` + `onChange`)
- Loading/disabled states prevent duplicate submissions
- Error messages surfaced from `err.response?.data?.detail`
- Enter key submits forms
- Chat history sent to backend for conversational context

---

## 10. API Documentation

Base URL (local): `http://localhost:8000`

Interactive Swagger UI: `http://localhost:8000/docs`

### `GET /`

Health / welcome endpoint.

**Response `200`:**
```json
{
  "status": "ok",
  "message": "Welcome to the GitHub Onboarding API"
}
```

---

### `POST /analyze`

Fetches a GitHub repository and generates an AI onboarding document.

| | |
|---|---|
| **Called from** | `App.jsx` → `handleAnalyze()` |
| **Authentication** | None |
| **Content-Type** | `application/json` |

**Request body:**

```json
{
  "github_url": "https://github.com/owner/repo"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `github_url` | string | Yes | Full GitHub repository URL |

**Success response `200`:**

```json
{
  "repo_id": "owner/repo",
  "onboarding_doc": "# Project Overview\n\n..."
}
```

**Error responses:**

| Status | Cause | Example `detail` |
|--------|-------|------------------|
| `400` | Invalid URL, repo not found, auth failure | `"Invalid GitHub URL..."`, `"Repo not found or is private."` |
| `500` | GitHub fetch failure or Gemini error | `"Failed to fetch repo context: ..."`, `"Failed to generate onboarding document: ..."` |

**Example (curl):**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"github_url": "https://github.com/fastapi/fastapi"}'
```

---

### `POST /chat`

Answers a question about a previously analyzed repository.

| | |
|---|---|
| **Called from** | `App.jsx` → `handleChat()` |
| **Authentication** | None |
| **Prerequisite** | Repository must be analyzed first (context stored in memory) |

**Request body:**

```json
{
  "repo_id": "owner/repo",
  "question": "How do I run this project locally?",
  "chat_history": [
    { "role": "user", "content": "What is the main entry point?" },
    { "role": "assistant", "content": "The main entry point is..." }
  ]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `repo_id` | string | Yes | — | `owner/repo` from `/analyze` response |
| `question` | string | Yes | — | User's current question |
| `chat_history` | array | No | `[]` | Prior `{ role, content }` messages |

**Success response `200`:**

```json
{
  "answer": "Based on the package.json, run `npm run dev` to start..."
}
```

**Error responses:**

| Status | Cause |
|--------|-------|
| `404` | `repo_id` not in memory — analyze the repo first |
| `500` | Gemini API failure |

**Example (curl):**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "repo_id": "fastapi/fastapi",
    "question": "What Python version is required?",
    "chat_history": []
  }'
```

---

## 11. Backend Explanation

### Server Architecture

- **Pattern:** Simple modular monolith — routes in `main.py`, business logic in service modules.
- **No** separate controllers, models, or ORM layers.
- **No** user authentication or authorization.
- **State:** In-memory Python dict (`repo_store`). Data is lost when the server restarts.

### `main.py` — Routes & Middleware

| Piece | Description |
|-------|-------------|
| `FastAPI()` | Creates the application instance |
| `CORSMiddleware` | Allows all origins (`*`) so the Vite dev server can call the API |
| `AnalyzeRequest` | Pydantic model — validates `github_url: str` |
| `ChatRequest` | Pydantic model — validates `repo_id`, `question`, optional `chat_history` |
| `repo_store` | `{ "owner/repo": repo_context_dict }` — session-like cache |

### `github_service.py` — GitHub Integration

| Function | Description |
|----------|-------------|
| `parse_github_url()` | Extracts `owner` and `repo`; strips trailing `.git` |
| `_github_get()` | Authenticated GET with fallback to unauthenticated on 401 |
| `fetch_repo_tree()` | Recursive file tree from GitHub Git Trees API |
| `fetch_default_branch()` | Reads repo metadata for branch name (`main`, etc.) |
| `fetch_file_content()` | Raw file content via `raw.githubusercontent.com` (max 3000 chars) |
| `get_repo_context()` | Orchestrates parsing, tree fetch, and up to 20 important files |

**Important files scanned:** `README.md`, `package.json`, `requirements.txt`, common entry points (`main.py`, `app.py`, `index.js`, etc.)

### `gemini_service.py` — AI Layer

| Function | Description |
|----------|-------------|
| `_generate_text()` | Low-level Gemini call with temperature `0.3` |
| `generate_onboarding()` | Builds a structured prompt → returns Markdown doc (max 4096 tokens) |
| `answer_question()` | Builds system prompt + chat history → returns answer (max 2048 tokens) |

**Model:** `gemini-2.5-flash`

### Middleware

Only **CORS** is configured. There is no logging middleware, rate limiting, or auth middleware.

---

## 12. Database Documentation

**This project does not use a database.**

| Topic | Status |
|-------|--------|
| Database engine | None |
| Schema / tables | None |
| Migrations | None |
| ORM (SQLAlchemy, etc.) | None |

Repository context is stored in a **Python in-memory dictionary** (`repo_store` in `main.py`). Implications:

- Restarting the server clears all analyzed repos.
- Not suitable for multi-user production without adding Redis, PostgreSQL, or similar.
- Chat requires the same server process that handled `/analyze`.

---

## 13. Configuration Files

### Files that exist in this project

#### `frontend/package.json`

Defines project metadata, npm scripts, and dependencies. See [Scripts](#14-scripts).

#### `frontend/vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
})
```

| Setting | Purpose |
|---------|---------|
| `plugins: [react()]` | Enables React JSX transformation and Fast Refresh during development |

#### `frontend/eslint.config.js`

Flat ESLint config (ESLint 10+):

| Setting | Purpose |
|---------|---------|
| `globalIgnores(['dist'])` | Skip linting build output |
| `js.configs.recommended` | Base JavaScript rules |
| `reactHooks.configs.flat.recommended` | Validates React hook usage |
| `reactRefresh.configs.vite` | Ensures components export correctly for HMR |
| `globals.browser` | Defines browser globals (`window`, `document`, etc.) |

#### `frontend/index.html`

| Element | Purpose |
|---------|---------|
| `<div id="root">` | React mount point |
| `<script type="module" src="/src/main.jsx">` | Loads the JS entry as an ES module |
| `<link rel="icon" href="/favicon.svg">` | Tab icon (**note:** only `icons.svg` exists in `public/` — add `favicon.svg` or update this link) |

#### `.gitignore` (root)

Ignores Python virtualenvs, `__pycache__`, `.env`, `node_modules/`, IDE folders.

---

### Files NOT used by this project

The following are common in other stacks but **do not exist** here:

| File | Status |
|------|--------|
| `tsconfig.json` | Not used — project is JavaScript (`.jsx`), not TypeScript |
| `next.config.js` | Not used — this is Vite + React, not Next.js |
| `tailwind.config.js` | Not used — styling is plain CSS |
| `postcss.config.js` | Not used |
| `vercel.json` | Not present |
| `Dockerfile` / `docker-compose.yml` | Not present |

---

## 14. Scripts

### Frontend (`frontend/package.json`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server at `http://localhost:5173` |
| `build` | `vite build` | Production build → `dist/` |
| `lint` | `eslint .` | Lint all JS/JSX files |
| `preview` | `vite preview` | Preview production build locally |

### Backend (manual commands)

| Command | Description |
|---------|-------------|
| `uvicorn main:app --reload --port 8000` | Run API with auto-reload |
| `uvicorn main:app --host 0.0.0.0 --port 8000` | Expose API on all network interfaces (for LAN testing) |

---

## 15. Assets

### `frontend/public/icons.svg`

An SVG **sprite sheet** containing reusable icon symbols:

| Symbol ID | Description |
|-----------|-------------|
| `github-icon` | GitHub logo |
| `discord-icon` | Discord logo |
| `bluesky-icon` | Bluesky logo |
| `x-icon` | X (Twitter) logo |
| `documentation-icon` | Document icon |
| `social-icon` | Social/community icon |

These are referenced via `<svg><use href="/icons.svg#github-icon" /></svg>` pattern. Currently **not imported** in `App.jsx` — available for future footer/social links.

### Images & Fonts

No custom image or font files are bundled. The UI uses system fonts:

```css
font-family: system-ui, 'Segoe UI', Roboto, sans-serif;
```

### `public/` folder purpose

Files in `public/` are served at the site root (`/icons.svg`). They are **not** processed by Vite's bundler.

---

## 16. Deployment

### Backend

Deploy FastAPI with Uvicorn (or Gunicorn + Uvicorn workers) on any Python host:

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- AWS / GCP / Azure VM

Set environment variables (`GEMINI_API_KEY`, optional `GITHUB_TOKEN`) on the host.

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

Build static files and host on any static CDN:

```bash
cd frontend
npm run build
# Deploy contents of dist/ to Vercel, Netlify, GitHub Pages, etc.
```

Set `VITE_API_BASE` to your deployed backend URL **before** running `npm run build` (Vite embeds env vars at build time).

### CORS

For production, replace `allow_origins=["*"]` in `main.py` with your frontend domain:

```python
allow_origins=["https://your-frontend-domain.com"]
```

---

## 17. Troubleshooting

| Error | Likely cause | Fix |
|-------|--------------|-----|
| `401 Unauthorized` (GitHub) | Invalid `GITHUB_TOKEN` | Regenerate token or remove it for public repos |
| `GEMINI_API_KEY is not set` | Missing backend `.env` | Add key to `backend/.env` and restart server |
| `Repo not found or is private` | Private repo without token | Add a GitHub token with `repo` scope |
| `Repo not found. Please analyze first.` | Server restarted between analyze and chat | Re-analyze the repository |
| Frontend can't reach API | Wrong `VITE_API_BASE` or backend not running | Start backend on port 8000; check `.env` |
| CORS errors in browser | Backend not running or wrong origin | Ensure backend is up; check CORS settings for production |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git switch -c feature/my-change`)
3. Commit your changes
4. Push and open a Pull Request

---

## License

MIT — see repository license file if present.

---

<p align="center">
  Built with FastAPI, React, GitHub API, and Google Gemini
</p>
