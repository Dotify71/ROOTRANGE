# ROOTRANGE Environment Variable Reference

This document lists all environment variables recognized by ROOTRANGE at build time and runtime.

---

## Configuration Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_APP_NAME` | `string` | `ROOTRANGE` | The public application title displayed in the browser header and telemetry badges. |
| `VITE_APP_VERSION` | `string` | `1.0.0` | The application semantic release version string. |
| `VITE_ENABLE_AUDIO` | `boolean` | `true` | Enables or disables procedural Web Audio API synthesizers across the workstation. |
| `VITE_OFFLINE_MODE` | `boolean` | `true` | When `true`, forces GhostOps AI to operate 100% locally with zero external network calls. |
| `VITE_AI_PROVIDER_URL` | `string` | `http://localhost:11434` | (Optional) Endpoint URL for local Ollama server or custom OpenAI-compatible proxy. |
| `VITE_AI_PROVIDER_MODEL`| `string` | `llama3` | (Optional) Model identifier string passed to the external AI provider endpoint. |

---

## Development Setup

To use environment variables in local development, copy the `.env.example` template:

```bash
cp .env.example .env
```

Vite automatically exposes variables prefixed with `VITE_` to client code via `import.meta.env`.
