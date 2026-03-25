# Changelog

## v1.0.0 — 2026-03-25

Initial open source release.

### Features

- **DOCX conversion** — Pandoc extracts structure and images; AI Vision generates image descriptions; outputs `full.md`, `text-only.md`, `images/`
- **PDF conversion** — Ghostscript renders PDF pages; AI Vision reads content page by page; outputs `text-only.md`
- **Batch upload** — convert multiple files in a single session
- **Multi AI provider** — Gemini, OpenAI, Anthropic switchable from the Settings UI; API keys encrypted AES-256
- **Image compression** — Sharp resizes images to max 1600px at 80% quality before AI processing
- **PDF compression presets** — screen / ebook / printer / prepress via Ghostscript
- **Inline editor** — preview and edit Markdown output before downloading
- **Conversion history** — list of past conversions with download and delete
- **Auto cleanup** — uploads and outputs deleted after 24h
- **Setup wizard** — `/setup` page for first-run admin account creation
- **Self-hosted auth** — NextAuth.js with bcrypt-hashed passwords stored in DB
- **Settings page** — AI provider selection, API key management, custom prompt editor
- **Bilingual prompts** — English and Vietnamese AI prompt presets
- **Deploy scripts** — `deploy/deploy.sh`, `deploy/setup-vps.sh`, `deploy/nginx.conf`
- **Docker support** — `Dockerfile` + `docker-compose.yml`
