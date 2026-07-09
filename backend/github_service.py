import requests
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") 

IMPORTANT_FILES = [
    "README.md", "readme.md", "README.rst",
    "main.py", "app.py", "index.py", "server.py", "run.py",
    "main.js", "index.js", "app.js", "server.js",
    "main.ts", "index.ts", "app.ts",
    "package.json", "requirements.txt", "pyproject.toml",
    "docker-compose.yml", "Dockerfile", ".env.example",
    "pom.xml", "build.gradle", "Makefile",
]

def parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo name from GitHub URL."""
    url = url.rstrip("/").replace("https://github.com/", "")
    parts = url.split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub URL. Format: https://github.com/owner/repo")
    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo

def _github_get(url: str) -> requests.Response:
    """GET from GitHub API; retries without auth if the token is invalid."""
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    response = requests.get(url, headers=headers)
    if response.status_code == 401 and GITHUB_TOKEN:
        response = requests.get(url, headers={"Accept": "application/vnd.github+json"})
    return response

def fetch_repo_tree(owner: str, repo: str) -> list[dict]:
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    response = _github_get(url)
    if response.status_code == 404:
        raise ValueError("Repo not found or is private.")
    if response.status_code == 401:
        raise ValueError(
            "GitHub authentication failed. Check GITHUB_TOKEN in backend/.env "
            "or remove it to use public repos only."
        )
    response.raise_for_status()
    tree = response.json().get("tree", [])
    return [item for item in tree if item["type"] == "blob"]

def fetch_default_branch(owner: str, repo: str) -> str:
    url = f"https://api.github.com/repos/{owner}/{repo}"
    response = _github_get(url)
    response.raise_for_status()
    return response.json().get("default_branch", "main")

def fetch_file_content(owner: str, repo: str, path: str, branch: str) -> Optional[str]:
    """Fetch raw content of a single file."""
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    response = requests.get(url)
    if response.status_code != 200:
        return None
    content = response.text
    if len(content) > 3000:
        content = content[:3000] + "\n\n... [truncated]"
    return content

def get_repo_context(github_url: str) -> dict:
    owner, repo = parse_github_url(github_url)
    branch = fetch_default_branch(owner, repo)
    tree = fetch_repo_tree(owner, repo)

    all_paths = [item["path"] for item in tree]

    files_to_fetch = []
    for item in tree:
        filename = item["path"].split("/")[-1]
        if filename in IMPORTANT_FILES:
            files_to_fetch.append(item["path"])

    files_to_fetch = files_to_fetch[:20]

    file_contents = {}
    for path in files_to_fetch:
        content = fetch_file_content(owner, repo, path, branch)
        if content:
            file_contents[path] = content

    return {
        "owner": owner,
        "repo": repo,
        "all_paths": all_paths,
        "file_contents": file_contents,
    }