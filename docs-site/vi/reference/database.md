# Database Schema

## Database

| Thông tin | Giá trị |
|---|---|
| Engine | PostgreSQL |
| ORM | Prisma |
| DB name | `mdconvert` (configurable qua `DATABASE_URL`) |

---

## Models

### Conversion

| Cột | Type | Nullable | Default | Mô tả |
|---|---|---|---|---|
| `id` | String (UUID) | Không | `uuid()` | Primary key |
| `fileName` | String | Không | | Tên file gốc |
| `fileType` | String | Không | | `docx` hoặc `pdf` |
| `fileSize` | Int | Không | | Dung lượng file gốc (bytes) |
| `compressLevel` | String | Có | null | PDF: `screen`/`ebook`/`printer`/`prepress`. DOCX: null |
| `compressedSize` | Int | Có | null | Dung lượng sau nén (bytes) |
| `originalPath` | String | Không | | Đường dẫn file trong `uploads/` |
| `fullMdPath` | String | Có | null | Đường dẫn `full.md` (chỉ DOCX) |
| `textOnlyMdPath` | String | Không | | Đường dẫn `text-only.md` |
| `imagesDir` | String | Có | null | Đường dẫn thư mục `images/` (chỉ DOCX) |
| `imageCount` | Int | Không | 0 | Số hình đã xử lý (PDF = 0) |
| `status` | String | Không | `pending` | Xem luồng trạng thái bên dưới |
| `errorMessage` | String | Có | null | Chi tiết lỗi nếu `status = failed` |
| `createdBy` | String | Không | | User ID từ NextAuth |
| `createdAt` | DateTime | Không | `now()` | |
| `updatedAt` | DateTime | Không | auto | |
| `deletedAt` | DateTime | Có | null | Soft delete |

### ImageDescription

| Cột | Type | Nullable | Mô tả |
|---|---|---|---|
| `id` | String (UUID) | Không | Primary key |
| `conversionId` | String | Không | FK → Conversion.id |
| `imageName` | String | Không | Tên file hình |
| `imagePath` | String | Không | Đường dẫn hình |
| `description` | String | Không | Mô tả chi tiết từ AI |
| `shortAlt` | String | Không | Alt text ngắn cho Markdown |
| `createdAt` | DateTime | Không | |

---

## Quan hệ

```
User       1 ──── * Conversion
Conversion 1 ──── * ImageDescription
```

---

## Luồng trạng thái

```
pending → compressing → processing → completed
    │          │             │
    └──────────┴─────────────┴──→ failed
```

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | File đã upload, chờ xử lý |
| `compressing` | Ghostscript (PDF) hoặc Sharp (ảnh DOCX) đang chạy |
| `processing` | Đang gọi AI Vision API |
| `completed` | Xong — output sẵn sàng |
| `failed` | Lỗi ở bất kỳ bước nào — xem `errorMessage` |
