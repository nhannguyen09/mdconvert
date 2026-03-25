# Constitution: mdconvert
<!-- Không thay đổi trừ khi có lệnh rõ ràng -->

## Tech Stack (cố định)

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind CSS |
| Icons | Lucide React |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js |
| Convert DOCX | Pandoc CLI (`pandoc -t markdown_strict --extract-media`) |
| Compress hình | sharp (npm) |
| Compress PDF | Ghostscript CLI (`gs -sDEVICE=pdfwrite -dPDFSETTINGS=/[preset]`) |
| AI Vision | Gemini 2.5 Flash-Lite API |
| Markdown render | react-markdown + remark-gfm |
| File upload | multer |
| ZIP | archiver |
| Font | Plus Jakarta Sans, DM Sans, Be Vietnam Pro |

## Design System

| Token | Giá trị |
|---|---|
| Primary | Navy #1A428A |
| Accent | Teal #3CABD2 |
| Theme | LUÔN light theme |
| Border radius | 8px |
| Font stack | Plus Jakarta Sans, DM Sans, Be Vietnam Pro |

## Security Rules

| # | Quy tắc |
|---|---|
| S01 | .env KHÔNG BAO GIỜ commit lên git |
| S02 | Mọi API route cần auth đều phải có middleware check |
| S03 | File upload validate: chỉ .docx và .pdf, max 300MB |
| S04 | Gemini API key chỉ dùng server-side, không expose ra client |
| S05 | Ghostscript/Pandoc chạy qua child_process phải sanitize input filename |
| S06 | Upload dir và output dir nằm ngoài webroot |

## Database Rules

| # | Quy tắc |
|---|---|
| D01 | Mọi query qua Prisma ORM, không raw SQL |
| D02 | Soft delete (deletedAt) cho Conversion records |
| D03 | UUID cho primary key |
| D04 | createdAt + updatedAt trên mọi model |

## Deploy Rules

| # | Quy tắc |
|---|---|
| R01 | KHÔNG tự ý commit hoặc deploy khi chưa được lệnh |
| R02 | Build local trước, rsync lên VPS |
| R03 | VPS dir: /var/www/chelien-sop-converter/ |
| R04 | PM2 name: chelien-sop, port 2023 |
| R05 | Cần cài pandoc + ghostscript trên VPS trước khi deploy |

## Coding Rules

| # | Quy tắc |
|---|---|
| C01 | TypeScript strict mode |
| C02 | Mỗi API route 1 file, đặt trong app/api/ |
| C03 | Business logic tách ra lib/, không viết trong route handler |
| C04 | File convert logic tách theo engine: lib/converters/docx.ts, lib/converters/pdf.ts |
| C05 | Compress logic tách riêng: lib/compress/images.ts, lib/compress/pdf.ts |
| C06 | Gemini API wrapper: lib/ai/gemini.ts |
| C07 | Error handling: mọi async function phải try/catch, update status = "failed" + errorMessage |
| C08 | Không hardcode path, dùng env UPLOAD_DIR và OUTPUT_DIR |

## Out of Scope

| Không làm |
|---|
| Convert file khác ngoài .docx và .pdf |
| Tự động push vào Claude Project |
| Tự động deploy lên GoClaw |
| Multi-user phức tạp (role, permission) |
| Realtime collaboration |
