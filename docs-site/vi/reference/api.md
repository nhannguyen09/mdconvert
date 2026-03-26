# API Reference

Tất cả endpoint yêu cầu xác thực (NextAuth session cookie).

---

## POST /api/upload

Upload file và tạo conversion record.

| Thông tin | Giá trị |
|---|---|
| Method | POST |
| Content-Type | multipart/form-data |
| Auth | Bắt buộc |

### Request

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `file` | File | Có | `.docx` hoặc `.pdf`, tối đa 100MB |
| `compressLevel` | String | Không | PDF only: `screen` / `ebook` / `printer` / `prepress`. Mặc định: `ebook` |

### Response 201

```json
{
  "id": "uuid",
  "fileName": "sop-dong-goi.docx",
  "fileType": "docx",
  "fileSize": 52428800,
  "status": "pending"
}
```

### Lỗi

| Code | Khi nào |
|---|---|
| 400 | File không phải `.docx`/`.pdf`, hoặc vượt 100MB |
| 401 | Chưa đăng nhập |

---

## POST /api/convert

Trigger convert cho file đã upload.

### Request

```json
{ "conversionId": "uuid" }
```

### Response 200

```json
{
  "id": "uuid",
  "status": "compressing"
}
```

Convert chạy bất đồng bộ. Poll trạng thái qua `GET /api/convert/[id]`.

---

## GET /api/convert/[id]

Lấy trạng thái và kết quả convert.

### Response 200

```json
{
  "id": "uuid",
  "fileName": "sop-dong-goi.docx",
  "fileType": "docx",
  "status": "completed",
  "imageCount": 12,
  "fullMd": "# SOP Đóng Gói\n\nNội dung...",
  "textOnlyMd": "# SOP Đóng Gói\n\nNội dung...",
  "images": [
    {
      "id": "uuid",
      "imageName": "dong-goi-img-001.png",
      "shortAlt": "Vị trí đặt túi trên máy seal",
      "description": "Hình cho thấy túi trà 100g..."
    }
  ],
  "createdAt": "2026-03-25T10:00:00Z"
}
```

Khi `status` là `pending` / `compressing` / `processing`: `fullMd` và `textOnlyMd` = `null`.

---

## PUT /api/convert/[id]/edit

Lưu Markdown đã chỉnh sửa.

### Request

```json
{
  "fullMd": "# Nội dung đã sửa...",
  "textOnlyMd": "# Nội dung đã sửa..."
}
```

`fullMd` có thể là `null` với convert PDF.

---

## GET /api/convert/[id]/download

Tải về ZIP chứa tất cả output.

### Nội dung ZIP — DOCX

```
[slug]-YYYYMMDD.zip
├── [slug]-full.md
├── [slug]-text-only.md
└── images/
    ├── [slug]-img-001.png
    └── ...
```

### Nội dung ZIP — PDF

```
[slug]-YYYYMMDD.zip
└── [slug]-text-only.md
```

---

## GET /api/history

Danh sách lịch sử convert (phân trang).

### Query params

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `page` | Int | 1 | Số trang |
| `limit` | Int | 20 | Số item mỗi trang |

### Response 200

```json
{
  "data": [...],
  "total": 15,
  "page": 1,
  "limit": 20
}
```
