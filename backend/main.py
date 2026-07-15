from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from github_service import get_repo_context
from groq_service import generate_onboarding, answer_question
from cache_service import cache

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory repo context store (reset on server restart)
repo_store: dict = {}


class AnalyzeRequest(BaseModel):
    github_url: str


class ChatRequest(BaseModel):
    repo_id: str
    question: str
    chat_history: list[dict] = []


@app.get("/")
def root():
    return {"status": "ok", "message": "Welcome to the CodeCompass API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "CodeCompass API"}


@app.post("/analyze")
def analyze_repo(request: AnalyzeRequest):
    try:
        repo_context = get_repo_context(request.github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repo context: {str(e)}")

    repo_id = f"{repo_context['owner']}/{repo_context['repo']}"
    repo_store[repo_id] = repo_context

    # ✅ Return cached onboarding doc if available (saves all Groq tokens)
    cached_doc = cache.get_onboarding(repo_id)
    if cached_doc:
        return {"repo_id": repo_id, "onboarding_doc": cached_doc, "from_cache": True}

    # Cache miss → call Groq, then store result
    try:
        onboarding_doc = generate_onboarding(repo_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate onboarding document: {str(e)}")

    cache.set_onboarding(repo_id, onboarding_doc)
    return {"repo_id": repo_id, "onboarding_doc": onboarding_doc, "from_cache": False}


@app.post("/chat")
def chat(request: ChatRequest):
    repo_context = repo_store.get(request.repo_id)
    if not repo_context:
        raise HTTPException(status_code=404, detail="Repo not found. Please analyze first.")

    # ✅ Return cached answer if this exact question was already asked
    cached_answer = cache.get_chat(request.repo_id, request.question)
    if cached_answer:
        return {"answer": cached_answer, "from_cache": True}

    # Cache miss → call Groq, then store result
    try:
        answer = answer_question(request.question, repo_context, request.chat_history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to answer question: {str(e)}")

    cache.set_chat(request.repo_id, request.question, answer)
    return {"answer": answer, "from_cache": False}


@app.get("/cache/stats")
def cache_stats():
    """View live cache hit counts and TTL info."""
    return cache.get_stats()


@app.post("/cache/clear")
def cache_clear():
    """Manually flush all cached entries (useful during development)."""
    return cache.clear()