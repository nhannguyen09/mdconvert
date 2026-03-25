# Database Schema: mdconvert

## Database

| Thông tin | Giá trị |
|---|---|
| Engine | PostgreSQL |
| ORM | Prisma |
| DB name | mdconvert (configurable via DATABASE_URL) |

## Models

### Conversion

| Column | Type | Nullable | Default | Mô tả |
|---|---|---|---|---|
| id | String (UUID) | No | uuid() | Primary key |
| fileName | String | No | | Tên file gốc (VD: "sop-dong-goi.docx") |
| fileType | String | No | | "docx" hoặc "pdf" |
| fileSize | Int | No | | Dung lượng file gốc (bytes) |
| compressLevel | String | Yes | null | PDF: "screen"/"ebook"/"printer"/"prepress". DOCX: null |
| compressedSize | Int | Yes | null | Dung lượng sau compress (bytes) |
| originalPath | String | No | | Đường dẫn file gốc trong uploads/ |
| fullMdPath | String | Yes | null | Đường dẫn full.md (chỉ DOCX) |
| textOnlyMdPath | String | No | | Đường dẫn text-only.md (cả DOCX và PDF) |
| imagesDir | String | Yes | null | Đường dẫn thư mục images/ (chỉ DOCX) |
| imageCount | Int | No | 0 | Số hình đã xử lý (PDF = 0) |
| status | String | No | "pending" | pending/compressing/processing/completed/failed |
| errorMessage | String | Yes | null | Chi tiết lỗi nếu status = failed |
| createdBy | String | No | | User ID (từ NextAuth session) |
| createdAt | DateTime | No | now() | |
| updatedAt | DateTime | No | updatedAt | |
| deletedAt | DateTime | Yes | null | Soft delete |

### ImageDescription

| Column | Type | Nullable | Default | Mô tả |
|---|---|---|---|---|
| id | String (UUID) | No | uuid() | Primary key |
| conversionId | String | No | | FK → Conversion.id |
| imageName | String | No | | Tên file hình (VD: "dong-goi-img-001.png") |
| imagePath | String | No | | Đường dẫn hình gốc |
| description | String | No | | Mô tả chi tiết từ AI (tiếng Việt) |
| shortAlt | String | No | | Alt text ngắn cho markdown |
| createdAt | DateTime | No | now() | |

### User (NextAuth managed)

Dùng NextAuth Prisma adapter chuẩn. Không custom thêm field.

## Relationships

```
Conversion 1 ──── * ImageDescription
User       1 ──── * Conversion
```

## Status flow

```
pending → compressing → processing → completed
    │          │             │
    └──────────┴─────────────┴──→ failed
```

| Status | Ý nghĩa |
|---|---|
| pending | File đã upload, chờ xử lý |
| compressing | Đang compress (PDF: Ghostscript, DOCX: sharp) |
| processing | Đang gọi Gemini API |
| completed | Xong, output sẵn sàng |
| failed | Lỗi ở bất kỳ bước nào, xem errorMessage |

## Indexes

| Index | Columns | Lý do |
|---|---|---|
| idx_conversion_created_by | createdBy | Query lịch sử theo user |
| idx_conversion_status | status | Filter theo status |
| idx_conversion_created_at | createdAt DESC | Sort mặc định |
| idx_image_conversion_id | conversionId | Join với Conversion |
