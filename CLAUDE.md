# mdconvert
<!-- v1.0 - 2026-03 -->

## Project Overview

| Thông tin | Giá trị |
|---|---|
| Tên | mdconvert |
| Mục tiêu | Convert file SOP (.docx, .pdf) sang Markdown tối ưu cho AI agent, Claude Project, Claude Code |
| Stack | Next.js 14 + TypeScript + Prisma + PostgreSQL + Tailwind CSS |
| External tools | Pandoc (CLI), Ghostscript (CLI), Gemini API, sharp (npm) |
| Port | 2023 (dev), 2023 (prod) |
| PM2 | mdconvert |
| Trạng thái | v1.0 open source ✅ |

## Hai flow xử lý

| Input | Engine | Compress | Output |
|---|---|---|---|
| .docx | Pandoc → sharp → Gemini | sharp (resize 1600px, quality 80%) | full.md + text-only.md + images/ |
| .pdf | Ghostscript → Gemini | Ghostscript (4 preset: screen/ebook/printer/prepress) | text-only.md |

## Quy tắc quan trọng

→ Xem docs/constitution.md
→ Xem docs/security-requirements.md

## Môi trường & Credentials

| Biến | Mô tả |
|---|---|
| DATABASE_URL | postgresql://user:password@localhost:5432/mdconvert |
| NEXTAUTH_SECRET | Auth secret (>= 32 ký tự) |
| NEXTAUTH_URL | http://localhost:2023 |
| GEMINI_API_KEY | Google AI Studio API key (hoặc nhập qua /settings) |
| ENCRYPTION_KEY | AES-256 key cho AppSetting (32 chars) |
| UPLOAD_DIR | ./uploads |
| OUTPUT_DIR | ./outputs |

## Deploy

```bash
# Sync code lên VPS (configure VPS_IP, VPS_PORT, APP_DIR trong deploy/deploy.sh)
bash deploy/deploy.sh
```

## First run

Sau khi deploy, mở `https://your-domain.com/setup` để tạo tài khoản admin đầu tiên.

## Milestone

| Đã làm | Chưa làm |
|---|---|
| Phase 1: DOCX convert engine | Multi-user / role management |
| Phase 2: Batch upload + history + settings | Realtime collaboration |
| Phase 3: Deploy + Auth + Setup Wizard | - |
