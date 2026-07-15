import hashlib
from datetime import datetime, timedelta


class CacheService:
    def __init__(self, ttl_hours: int = 24):
        self._onboarding_cache: dict = {}  # repo_id → {doc, time}
        self._chat_cache: dict = {}        # md5(repo+question) → {answer, time}
        self.ttl = timedelta(hours=ttl_hours)

    def _is_expired(self, timestamp: datetime) -> bool:
        return datetime.now() - timestamp > self.ttl

    # ── Onboarding cache ─────────────────────────────────────────────────────

    def get_onboarding(self, repo_id: str) -> str | None:
        """Return cached onboarding doc if present and not expired."""
        entry = self._onboarding_cache.get(repo_id)
        if entry and not self._is_expired(entry["time"]):
            return entry["doc"]
        return None

    def set_onboarding(self, repo_id: str, doc: str) -> None:
        self._onboarding_cache[repo_id] = {"doc": doc, "time": datetime.now()}

    # ── Chat answer cache ─────────────────────────────────────────────────────

    def _chat_key(self, repo_id: str, question: str) -> str:
        return hashlib.md5(f"{repo_id}:{question.strip().lower()}".encode()).hexdigest()

    def get_chat(self, repo_id: str, question: str) -> str | None:
        """Return cached answer if the exact question was already asked."""
        entry = self._chat_cache.get(self._chat_key(repo_id, question))
        if entry and not self._is_expired(entry["time"]):
            return entry["answer"]
        return None

    def set_chat(self, repo_id: str, question: str, answer: str) -> None:
        self._chat_cache[self._chat_key(repo_id, question)] = {
            "answer": answer,
            "time": datetime.now(),
        }

    # ── Stats ─────────────────────────────────────────────────────────────────

    def get_stats(self) -> dict:
        now = datetime.now()
        active_onboarding = sum(
            1 for e in self._onboarding_cache.values()
            if not self._is_expired(e["time"])
        )
        active_chat = sum(
            1 for e in self._chat_cache.values()
            if not self._is_expired(e["time"])
        )
        return {
            "onboarding_cached": active_onboarding,
            "chat_answers_cached": active_chat,
            "ttl_hours": self.ttl.seconds // 3600,
            "checked_at": now.isoformat(),
        }

    def clear(self) -> dict:
        """Manually flush all caches (useful for testing)."""
        ob = len(self._onboarding_cache)
        ch = len(self._chat_cache)
        self._onboarding_cache.clear()
        self._chat_cache.clear()
        return {"cleared_onboarding": ob, "cleared_chat": ch}


# Singleton used by main.py
cache = CacheService(ttl_hours=24)
