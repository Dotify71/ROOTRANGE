# ROOTRANGE GhostOps AI Provider Configuration

ROOTRANGE includes **GhostOps AI**, an integrated Socratic mentor and offensive educational assistant. GhostOps works out-of-the-box with **zero external dependencies** and can optionally connect to local or cloud language models.

---

## 1. Provider Modes

### 1. Offline Deterministic Provider (Default)
- **Status**: Always available, zero setup, 100% offline.
- **Cost**: Free ($0.00).
- **Mechanism**: Evaluates active target configuration, current compromise level (`NONE`, `RECON`, `USER`, `ROOT`), and active evidence to deliver 5 graduated hint tiers:
  - **Level 1**: General Direction.
  - **Level 2**: Relevant Service / Category.
  - **Level 3**: Specific Evidence to Inspect.
  - **Level 4**: Explicit Next-Step Guidance.
  - **Level 5**: Full Step-by-Step Walkthrough.

### 2. Local Ollama (Recommended for Local LLMs)
- Connects to your local Ollama server running on `http://localhost:11434`.
- Supported Models: `llama3`, `mistral`, `codellama`, `deepseek-coder`, `qwen2.5-coder`.
- **Privacy**: 100% local, no data leaves your machine.

### 3. OpenAI-Compatible API
- Connects to OpenAI (`https://api.openai.com/v1`) or any OpenAI-compatible proxy (e.g. vLLM, LM Studio, LocalAI).
- Supported Models: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`.

### 4. Anthropic Claude API
- Connects to Anthropic API (`https://api.anthropic.com/v1`).
- Supported Models: `claude-3-5-sonnet`, `claude-3-haiku`.

### 5. Google Gemini API
- Connects to Google Gemini API (`https://generativelanguage.googleapis.com/v1beta`).
- Supported Models: `gemini-1.5-flash`, `gemini-1.5-pro`.

---

## 2. In-App Configuration

You can configure external AI providers directly from the **GhostOps AI** tab (`/ai`):

1. Navigate to **GhostOps AI** in the workstation sidebar.
2. Select **Settings & Providers** tab.
3. Choose your desired provider from the dropdown menu.
4. Input your endpoint URL (for Ollama or custom proxies) or API key.
5. Click **SAVE CONFIGURATION**.

> [!NOTE]
> **API Key Safety**: API keys are stored strictly in browser session memory. They are NEVER persisted to disk, never baked into production bundles, and never sent to any server other than the designated provider endpoint.

---

## 3. Resilient Error Handling & Fallback

If an external AI provider fails (e.g. network timeout, rate limit, invalid API key, or Ollama server stopped), GhostOps **gracefully falls back to the Offline Deterministic Provider**. Gameplay and learning continue uninterrupted without unhandled exceptions or broken interfaces.
