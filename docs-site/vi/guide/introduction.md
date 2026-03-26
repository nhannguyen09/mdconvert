# Giới thiệu

## mdconvert là gì?

**mdconvert** là công cụ web tự host giúp chuyển đổi file `.docx` và `.pdf` thành Markdown sạch, tối ưu cho AI agents, Claude Projects và Claude Code.

Khi đưa tài liệu vào AI, văn bản thuần thường không đủ — đặc biệt với SOP, hướng dẫn vận hành, hay tài liệu có nhiều hình ảnh. mdconvert giải quyết điều này bằng cách:

1. Trích xuất hình ảnh từ file Word
2. Gửi từng hình đến AI Vision (Gemini / OpenAI / Anthropic)
3. Tạo mô tả chi tiết cho từng hình
4. Ghép tất cả thành file Markdown hoàn chỉnh

Kết quả là `full.md` mà AI có thể hiểu đầy đủ — kể cả phần hình ảnh.

## Trường hợp sử dụng

| Trường hợp | mdconvert giúp gì |
|---|---|
| **Claude Projects** | Upload SOP dạng Markdown — Claude hiểu được cả hình ảnh |
| **Claude Code** | Đưa `full.md` vào project để Claude Code có đủ context |
| **AI Agents** | Feed Markdown có cấu trúc thay vì PDF thô |
| **Knowledge base** | Convert tài liệu công ty sang Markdown để index |
| **Biên dịch / chỉnh sửa** | Sửa Markdown trực tiếp trên editor tích hợp |

## Hai luồng xử lý

```
DOCX → Pandoc → trích xuất text + hình → AI Vision → full.md + text-only.md + images/

PDF  → Ghostscript → nén → AI Vision (từng trang) → text-only.md
```

## Tính năng chính

- **Upload hàng loạt** — convert nhiều file trong một phiên
- **Đa AI provider** — Gemini, OpenAI, Anthropic — chuyển đổi ngay trên UI
- **Editor tích hợp** — preview và sửa Markdown trước khi tải về
- **Tự động dọn dẹp** — file bị xóa sau 24 giờ
- **Tự host** — dữ liệu ở lại server của bạn
- **Prompt song ngữ** — preset tiếng Anh và tiếng Việt

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Xử lý DOCX | Pandoc (CLI) |
| Xử lý PDF | Ghostscript (CLI) |
| Nén ảnh | Sharp |
| AI Vision | Gemini / OpenAI / Anthropic |
| Xác thực | NextAuth.js |
