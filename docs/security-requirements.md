# Security Requirements: chelien-sop-converter

## Tầng 1: Authentication + Authorization

| # | Quy tắc | Chi tiết | Ưu tiên |
|---|---|---|---|
| 1.1 | Password hash bằng bcrypt | salt rounds >= 10 | Bắt buộc |
| 1.2 | JWT token có thời hạn | Access: 1h, Refresh: 7 ngày | Bắt buộc |
| 1.3 | Rate limiting login | Sai 5 lần = khoá 15 phút | Bắt buộc |
| 1.4 | Auth middleware trên mọi API | Trừ /api/auth và /api/health | Bắt buộc |
| 1.5 | API trả 403 khi chưa login | Không trả 404 | Bắt buộc |

### Role

| Role | Quyền |
|---|---|
| admin | Upload, convert, edit, download, xem history tất cả |
| user | Upload, convert, edit, download, xem history của mình |

Tool nội bộ, chỉ cần 2 role đơn giản.

## Tầng 2: Data Protection

### Credentials & Encryption

| # | Quy tắc | Chi tiết |
|---|---|---|
| 2.1 | HTTPS khi deploy | SSL Let's Encrypt |
| 2.2 | Secrets trong .env | GEMINI_API_KEY, NEXTAUTH_SECRET, DATABASE_URL |
| 2.3 | .env KHÔNG commit git | .gitignore đã có |
| 2.4 | .env.example bắt buộc | Đã có |
| 2.5 | NEXTAUTH_SECRET >= 32 ký tự | `openssl rand -hex 32` |
| 2.6 | Gemini API key chỉ server-side | Không expose ra client |

### Input Validation

| # | Quy tắc | Chi tiết |
|---|---|---|
| 2.7 | File upload validate | Chỉ .docx, .pdf. Check cả MIME type lẫn extension |
| 2.8 | Max file size 100MB | Reject sớm trước khi process |
| 2.9 | Sanitize filename | Loại ký tự đặc biệt trước khi truyền vào Pandoc/Ghostscript CLI |
| 2.10 | Chống command injection | Dùng execFile thay vì exec. Không nối string vào CLI command |
| 2.11 | CORS chỉ allow domain mình | Không `*` trên production |

### Soft Delete

| # | Quy tắc |
|---|---|
| 2.12 | Conversion records: soft delete (deletedAt) |
| 2.13 | File gốc trong uploads/: giữ lại 30 ngày rồi cron xóa |

## Tầng 3: Backup + Recovery

| # | Quy tắc | Chi tiết |
|---|---|---|
| 3.1 | Backup DB hàng ngày | pg_dump cron 2:00 AM |
| 3.2 | Upload backup lên Google Drive | rclone sync |
| 3.3 | Giữ 30 bản backup | Script xoá bản cũ |
| 3.4 | Health check endpoint | GET /api/health |

## Checklist trước deploy production

| # | Kiểm tra |
|---|---|
| 1 | HTTPS + redirect HTTP |
| 2 | .env không trong git |
| 3 | NEXTAUTH_SECRET >= 32 ký tự |
| 4 | Password hash bcrypt |
| 5 | Mọi API có auth middleware |
| 6 | File upload validate (type + size + MIME) |
| 7 | CLI command sanitized (execFile, không exec) |
| 8 | CORS chỉ allow domain của bạn |
| 9 | Soft delete, không DELETE thật |
| 10 | Backup tự động hoạt động |
