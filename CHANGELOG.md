# Changelog

## v1.0.2 — 2026-03-27

Security fixes và medium improvements từ code review.

### Security (Critical)

- **C1** — Xóa Ghostscript PostScript-injection fallback trong `countPdfPages()`. Chỉ dùng `pdfinfo` (poppler-utils). Throw error rõ ràng nếu chưa cài.
- **C2** — Ownership check trên tất cả `/api/convert/[id]/*` endpoints. User chỉ access được conversion của chính mình.
- **C3** — `createdBy` đọc từ NextAuth session thay vì hardcode `'system'`. Extract `authOptions` ra `lib/auth-options.ts` để reuse.

### Security (High)

- **H1** — `path.basename()` trên filename trước khi lưu disk — chặn path traversal `../../etc/passwd`.
- **H2** — Rollback file khỏi disk nếu `prisma.conversion.create` fail — không còn zombie files.
- **H3** — Stream write thay vì `file.arrayBuffer()` — tránh 300MB heap spike mỗi upload.
- **H4** — Atomic `updateMany WHERE status='pending'` thay vì check-then-update — fix race condition khi trigger convert.
- **H5** — `/api/cleanup` yêu cầu localhost hoặc `x-cleanup-secret` header — không thể gọi từ public internet.

### Improvements (Medium)

- **M1** — Thay `@@index([createdBy])` bằng composite `@@index([createdBy, deletedAt])` — tối ưu history query. Migration: `20260327035328_add_composite_index_and_security_fixes`.
- **M2** — Exponential backoff polling: 2s → tăng 1.5x mỗi 10 lần → max 10s. Dùng `?lite=true` khi polling để giảm response size.
- **M3** — `PROMPT_PRESETS` moved sang `lib/prompt-presets.ts` — single source of truth. Xóa duplicate trong `lib/settings.ts` và `components/SettingsForm.tsx`.
- **M5** — `GET /api/convert/[id]?lite=true` — chỉ trả metadata + status, bỏ markdown content. Dùng cho polling.
- **M6** — Sanitize Gemini error logs — xóa API key patterns (`AIza***`, `key=***`, `Bearer ***`) trước khi ghi log.

### Improvements (Low)

- **L2** — `lib/constants.ts` — tập trung toàn bộ magic numbers (timeouts, concurrency, intervals).
- **L4** — `PUT /api/convert/[id]/edit` kiểm tra `Content-Type: application/json`, trả 415 nếu sai.
- **L5** — Provider dropdown hiển thị `DOCX ✅ | PDF ❌` cho OpenAI/Anthropic — user biết trước giới hạn.

### Refactors

- `lib/auth-options.ts` — extracted từ `app/api/auth/[...nextauth]/route.ts`
- `lib/auth-helpers.ts` — `getSessionUserId()` + `getConversionWithOwnerCheck()` helpers
- `lib/prompt-presets.ts` — single source cho EN/VI prompt presets
- `lib/constants.ts` — magic numbers tập trung

---

## v1.0.1 — 2026-03-27

Community feedback — 6 PDF flow improvements.

### Bug Fixes

- **X6** — Error message đồng bộ với `MAX_FILE_SIZE`: đổi "100MB" → "300MB" trong `lib/upload.ts`
- **X2** — `countPdfPages()` dùng `pdfinfo` (poppler-utils) thay regex trên binary buffer; Ghostscript fallback nếu poppler chưa cài
- **X1** — Bỏ hardcode `MAX_BATCHES = 5` (giới hạn cứng 100 trang); thêm 2 settings mới `pdf_pages_per_batch` (default 20) và `pdf_max_pages` (default 0 = không giới hạn); UI "PDF Settings" trong `/settings`
- **X3** — Batch PDF xử lý song song 3 batch/lượt (`Promise.allSettled`) thay vì tuần tự; progress text cập nhật theo từng chunk
- **X4** — Provider không phải Gemini khi convert PDF: throw lỗi rõ ràng thay vì lỗi runtime ngầm; warning banner trong Settings UI
- **X5** — Cải thiện PDF prompt (cả EN và VI): thêm hướng dẫn heading hierarchy, bỏ header/footer lặp, đánh dấu số trang `<!-- Page X -->`

---

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
