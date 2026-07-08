import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = "gemini-1.5-flash"

if API_KEY:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel(MODEL)
else:
    model = None


def _generate_text(prompt: str, max_tokens: int) -> str:
    if not model:
        raise RuntimeError("GEMINI_API_KEY is not set")

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,
            "max_output_tokens": max_tokens,
        },
    )
    return response.text


def generate_onboarding(repo_context: dict) -> str:
    owner = repo_context["owner"]
    repo = repo_context["repo"]
    all_paths = repo_context["all_paths"]
    file_contents = repo_context["file_contents"]

    files_section = "\n".join(
        f"### {path}\n{content}" for path, content in file_contents.items()
    )

    folder_structure = "\n".join(all_paths[:100])

    prompt = f"""You are an expert software engineer onboarding a new developer to the repository: {owner}/{repo}.

    Here is the folder structure (up to 100 files):
    {folder_structure}

    Here are the key files and their contents:
    {files_section}

    Generate a comprehensive onboarding document with the following sections:
    1. **Project Overview** - What this project does in simple terms
    2. **Tech Stack** - Languages, frameworks, and tools used
    3. **Folder Structure** - Explain the purpose of key folders and files
    4. **Key Files** - What the most important files do
    5. **How to Get Started** - Setup steps based on what you see (requirements.txt, package.json, etc.)
    6. **Architecture Overview** - How the different parts connect

    Be specific, practical, and helpful for a developer seeing this codebase for the first time."""

    return _generate_text(prompt, 4096)


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

    prompt = "\n".join(
        f"{item['role']}: {item['content']}" for item in messages
    )

    return _generate_text(prompt, 2048)