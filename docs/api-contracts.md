# API Contracts: mdconvert

## POST /api/upload

Upload file và bắt đầu conversion.

| Field | Value |
|---|---|
| Method | POST |
| Content-Type | multipart/form-data |
| Auth | Required |

### Request body

| Param | Type | Required | Mô tả |
|---|---|---|---|
| file | File | Yes | File .docx hoặc .pdf, max 100MB |
| compressLevel | String | No | PDF only: "screen"/"ebook"/"printer"/"prepress". Default: "ebook" |

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

### Errors

| Code | Khi nào |
|---|---|
| 400 | File không phải .docx/.pdf, hoặc > 100MB |
| 401 | Chưa login |

---

## POST /api/convert

Trigger conversion cho 1 upload đã có.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required |

### Request body

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

Conversion chạy async. Client poll status qua GET /api/convert/[id].

---

## GET /api/convert/[id]

Lấy kết quả conversion.

| Field | Value |
|---|---|
| Method | GET |
| Auth | Required |

### Response 200

```json
{
  "id": "uuid",
  "fileName": "sop-dong-goi.docx",
  "fileType": "docx",
  "fileSize": 52428800,
  "compressLevel": null,
  "compressedSize": null,
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

Khi status = "pending"/"compressing"/"processing": fullMd và textOnlyMd = null. Client hiển thị loading.

---

## PUT /api/convert/[id]/edit

Lưu markdown đã chỉnh sửa.

| Field | Value |
|---|---|
| Method | PUT |
| Auth | Required |

### Request body

```json
{
  "fullMd": "# Nội dung đã sửa...",
  "textOnlyMd": "# Nội dung đã sửa..."
}
```

fullMd có thể null (PDF conversion không có full.md).

### Response 200

```json
{ "success": true }
```

---

## GET /api/convert/[id]/download

Download ZIP chứa output.

| Field | Value |
|---|---|
| Method | GET |
| Auth | Required |
| Response | application/zip |

### ZIP contents (DOCX)

```
[slug]-[YYYYMMDD].zip
├── [slug]-full.md
├── [slug]-text-only.md
└── images/
    ├── [slug]-img-001.png
    ├── [slug]-img-002.png
    └── ...
```

### ZIP contents (PDF)

```
[slug]-[YYYYMMDD].zip
└── [slug]-text-only.md
```

---

## GET /api/history

Danh sách lịch sử conversion.

| Field | Value |
|---|---|
| Method | GET |
| Auth | Required |

### Query params

| Param | Type | Default | Mô tả |
|---|---|---|---|
| page | Int | 1 | Trang |
| limit | Int | 20 | Số item mỗi trang |

### Response 200

```json
{
  "data": [
    {
      "id": "uuid",
      "fileName": "sop-dong-goi.docx",
      "fileType": "docx",
      "fileSize": 52428800,
      "compressedSize": 5242880,
      "imageCount": 12,
      "status": "completed",
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```
