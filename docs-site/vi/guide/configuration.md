# Cấu hình

## Biến môi trường

Copy `.env.example` thành `.env` và điền vào:

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | Connection string PostgreSQL, ví dụ: `postgresql://user:pass@localhost:5432/mdconvert` |
| `NEXTAUTH_SECRET` | Có | Chuỗi ngẫu nhiên ≥ 32 ký tự. Tạo bằng: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Có | URL của app, ví dụ: `http://localhost:2023` |
| `ENCRYPTION_KEY` | Có | Đúng 32 ký tự. Dùng để mã hóa API key trong DB |
| `GEMINI_API_KEY` | Không | Google AI Studio key. Có thể nhập trong trang Settings |
| `UPLOAD_DIR` | Không | Mặc định: `./uploads` |
| `OUTPUT_DIR` | Không | Mặc định: `./outputs` |

## AI Providers

Có thể chuyển đổi provider bất kỳ lúc nào từ trang **Settings** mà không cần khởi động lại server.

### Google Gemini

Lấy API key tại [Google AI Studio](https://aistudio.google.com/).

Model hỗ trợ:
- `gemini-1.5-flash` (nhanh, khuyến nghị)
- `gemini-1.5-pro` (chất lượng cao hơn)

### OpenAI

Lấy API key tại [platform.openai.com](https://platform.openai.com/).

Model hỗ trợ:
- `gpt-4o`
- `gpt-4o-mini`

### Anthropic

Lấy API key tại [console.anthropic.com](https://console.anthropic.com/).

Model hỗ trợ:
- `claude-3-5-sonnet-20241022`
- `claude-3-haiku-20240307`

## Prompt AI

Prompt mặc định hướng dẫn AI mô tả hình ảnh chi tiết và chuyển đổi cấu trúc tài liệu sang Markdown sạch.

Bạn có thể tùy chỉnh prompt trong **Settings** hoặc chọn preset:

| Preset | Ngôn ngữ output |
|---|---|
| English (mặc định) | Tiếng Anh |
| Vietnamese | Tiếng Việt |

## Tự động dọn dẹp

File trong `uploads/` và `outputs/` tự động bị xóa sau **24 giờ**. Scheduler chạy mỗi 6 giờ trong nền.

Để tắt hoặc điều chỉnh, sửa file `lib/cleanup-scheduler.ts`.
