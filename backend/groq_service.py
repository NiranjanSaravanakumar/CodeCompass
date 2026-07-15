import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

client = Groq(api_key=API_KEY) if API_KEY else None


def _generate_text(prompt: str, max_tokens: int) -> str:
    if not client:
        raise RuntimeError("GROQ_API_KEY is not set")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def generate_onboarding(repo_context: dict) -> str:
    owner = repo_context["owner"]
    repo = repo_context["repo"]
    all_paths = repo_context["all_paths"]
    file_contents = repo_context["file_contents"]

    # Cap file content display to first 40 paths (enough structure signal, fewer tokens)
    folder_structure = "\n".join(all_paths[:40])

    # Compact file section — each file already truncated in github_service
    files_section = "\n".join(
        f"[{path}]\n{content}" for path, content in file_contents.items()
    )

    prompt = (
        f"Repo: {owner}/{repo}\n\n"
        f"Structure (first 40 paths):\n{folder_structure}\n\n"
        f"Key files:\n{files_section}\n\n"
        "Write a concise developer onboarding doc covering:\n"
        "1. Project Overview\n"
        "2. Tech Stack\n"
        "3. Folder Structure (key dirs)\n"
        "4. Key Files\n"
        "5. Getting Started\n"
        "6. Architecture Overview\n"
        "Be specific and concise. Skip obvious boilerplate."
    )

    return _generate_text(prompt, 2048)


def answer_question(question: str, repo_context: dict, chat_history: list[dict]) -> str:
    owner = repo_context["owner"]
    repo = repo_context["repo"]
    all_paths = repo_context["all_paths"]
    file_contents = repo_context["file_contents"]

    files_section = "\n".join(
        f"### {path}\n{content}" for path, content in file_contents.items()
    )

    folder_structure = "\n".join(all_paths[:100])

    system_prompt = f"""You are an expert software engineer familiar with the repository: {owner}/{repo}.
    Here is the folder structure:
    {folder_structure}

    Here are the key files:
    {files_section}

    Answer questions about this codebase clearly and specifically. If something is not visible in the provided files, say so honestly."""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_history)
    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.3,
        max_tokens=2048,
    )
    return response.choices[0].message.content