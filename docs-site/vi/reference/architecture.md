# Kiến trúc

## Luồng dữ liệu

```
Browser → Upload API → File Storage (uploads/)
                            │
                ┌───────────┴───────────┐
                │                       │
            .docx?                  .pdf?
                │                       │
                ▼                       ▼
        Pandoc CLI              Ghostscript CLI
        (trích xuất md + ảnh)   (nén PDF)
                │                       │
                ▼                       ▼
        Sharp compress          AI Vision API
        (resize ảnh)            (PDF → markdown)
                │                       │
                ▼                       │
        AI Vision API                   │
        (ảnh → mô tả)                  │
                │                       │
                ▼                       ▼
        Assembler               Output: text-only.md
        (ghép md + mô tả)
                │
                ▼
        Output: full.md + text-only.md + images/
                │
                ▼
        DB (Conversion record) + File Storage (outputs/)
                │
                ▼
        Preview / Edit / Download ZIP
```

## Cấu trúc thư mục

```
mdconvert/
├── app/
│   ├── page.tsx                    # Trang upload
│   ├── login/page.tsx
│   ├── setup/page.tsx              # Wizard lần đầu
│   ├── batch/page.tsx              # Upload hàng loạt
│   ├── convert/[id]/page.tsx       # Kết quả: preview + edit + download
│   ├── history/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── upload/route.ts
│       ├── convert/route.ts
│       ├── convert/[id]/route.ts
│       ├── convert/[id]/edit/route.ts
│       ├── convert/[id]/download/route.ts
│       ├── history/route.ts
│       ├── settings/route.ts
│       └── setup/route.ts
├── components/
├── lib/
│   ├── converters/docx.ts          # Pipeline Pandoc + assemble
│   ├── converters/pdf.ts           # Pipeline Ghostscript + AI
│   ├── compress/images.ts          # Sharp resize + quality
│   ├── compress/pdf.ts             # Ghostscript presets
│   ├── ai/gemini.ts                # AI provider wrapper
│   ├── assembler.ts                # Ghép raw.md + mô tả → full.md
│   ├── settings.ts                 # AppSetting CRUD + mã hóa
│   ├── cleanup.ts                  # Xóa file cũ
│   ├── cleanup-scheduler.ts        # Cleanup tự động mỗi 6h
│   └── prisma.ts                   # Prisma client singleton
└── prisma/schema.prisma
```

## Component Map

| Component | Dùng ở | Chức năng |
|---|---|---|
| `UploadForm` | `/` | Drag-drop upload, hiển thị file info |
| `CompressSelector` | `/` | 4 mức Ghostscript, chỉ hiện khi upload PDF |
| `MarkdownPreview` | `/convert/[id]` | Render HTML từ Markdown |
| `MarkdownEditor` | `/convert/[id]` | Textarea sửa Markdown |
| `ConversionHistory` | `/history` | Bảng danh sách sort theo ngày |
| `StatusBadge` | Nhiều trang | Badge trạng thái: pending/compressing/processing/completed/failed |
| `HeaderNav` | Mọi trang | Top nav — ẩn trên `/login` và `/setup` |
