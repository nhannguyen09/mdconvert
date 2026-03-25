# mdconvert

**Convert Word & PDF to AI-ready Markdown with image descriptions**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

A self-hosted tool that converts `.docx` and `.pdf` files into clean Markdown optimized for AI agents, Claude Projects, and Claude Code. Images are extracted and described by AI vision — no manual work needed.

---

## Features

- **DOCX flow** — Pandoc extracts structure + images → AI Vision describes each image → outputs `full.md` (with image descriptions) + `text-only.md`
- **PDF flow** — Ghostscript renders pages → AI Vision reads content → outputs `text-only.md`
- **Batch upload** — convert multiple files in one go
- **Multi AI provider** — Gemini, OpenAI, Anthropic — switchable via the UI settings page, no redeploy needed
- **Image compression** — Sharp resizes images (max 1600px, 80% quality) before sending to AI
- **PDF compression presets** — screen / ebook / printer / prepress via Ghostscript
- **Preview & edit** — inline Markdown editor with live preview before downloading
- **Auto cleanup** — files deleted after 24h to protect privacy
- **Self-hosted** — your data never leaves your server
- **Bilingual prompts** — English and Vietnamese AI prompt presets

---

## How It Works

```
DOCX flow:
  .docx → Pandoc → extract text + images → Sharp compress → Gemini/OpenAI/Anthropic Vision
        → full.md (text + image descriptions) + text-only.md + images/

PDF flow:
  .pdf → Ghostscript compress → Gemini/OpenAI/Anthropic Vision (page by page)
       → text-only.md
```

| Output file | Content |
|---|---|
| `full.md` | Text + AI-generated image descriptions (DOCX only) |
| `text-only.md` | Clean text, no images |
| `images/` | Extracted + compressed image files (DOCX only) |

---

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/nhannguyen09/mdconvert.git
cd mdconvert
cp .env.example .env
# Edit .env: set DATABASE_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY
docker compose up -d
# Open http://localhost:2023/setup to create your admin account
```

### Manual

```bash
# Prerequisites
brew install pandoc ghostscript   # macOS
# Ubuntu: sudo apt install pandoc ghostscript

git clone https://github.com/nhannguyen09/mdconvert.git
cd mdconvert
npm install
cp .env.example .env
# Edit .env (see Configuration below)

npx prisma migrate deploy
npm run dev
# Open http://localhost:2023/setup
```

---

## Configuration

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random string ≥ 32 chars |
| `NEXTAUTH_URL` | Your app URL (e.g. `http://localhost:2023`) |
| `GEMINI_API_KEY` | Google AI Studio key (optional — can be set in UI) |
| `ENCRYPTION_KEY` | AES-256 key, exactly 32 chars |
| `UPLOAD_DIR` | Upload directory (default: `./uploads`) |
| `OUTPUT_DIR` | Output directory (default: `./outputs`) |

### AI Providers

API keys can be entered directly in the **Settings** page — no restart needed. Keys are encrypted at rest with AES-256.

| Provider | Models |
|---|---|
| Google Gemini | gemini-1.5-flash, gemini-1.5-pro |
| OpenAI | gpt-4o, gpt-4o-mini |
| Anthropic | claude-3-5-sonnet, claude-3-haiku |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| DOCX parsing | Pandoc (CLI) |
| PDF rendering | Ghostscript (CLI) |
| Image processing | Sharp (npm) |
| AI Vision | Gemini / OpenAI / Anthropic (configurable) |
| Auth | NextAuth.js |

---

## Self-Hosting

See [docs/SELF-HOSTING.md](docs/SELF-HOSTING.md) for detailed guides on Docker, VPS (Ubuntu), and Vercel deployment.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[AGPL-3.0](LICENSE) — free to use and self-host; modifications must be open-sourced under the same license.

---

> Built with ❤️ by [NhanNguyenSharing](https://nhannguyensharing.com) | Powered by Pandoc + AI Vision
