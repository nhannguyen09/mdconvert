# Chuyển đổi DOCX

## Luồng xử lý

```
.docx
  │
  ▼
Pandoc CLI
  → trích xuất Markdown thô (cấu trúc văn bản)
  → trích xuất tất cả hình ảnh nhúng
  │
  ▼
Sharp (nén ảnh)
  → resize tối đa 1600px chiều rộng
  → chất lượng 80%
  │
  ▼
AI Vision (Gemini / OpenAI / Anthropic)
  → tạo mô tả chi tiết cho từng hình
  → tạo alt text ngắn
  │
  ▼
Assembler
  → ghép Markdown thô + mô tả hình
  → tạo ra full.md và text-only.md
```

## File output

| File | Nội dung |
|---|---|
| `full.md` | Văn bản kèm mô tả hình ảnh do AI tạo, được chèn inline |
| `text-only.md` | Chỉ văn bản, không có tham chiếu hình ảnh |
| `images/` | Hình ảnh đã trích xuất và nén |

## Ví dụ

Input: file Word SOP có sơ đồ ở trang 3.

Output `full.md`:
```markdown
## Bước 3: Đóng gói

Đặt túi lên máy seal như hình dưới.

![Cài đặt máy seal](images/sop-img-003.png)
*Hình cho thấy túi trà 100g được đặt ở cạnh trái của thanh seal,
miệng túi quay sang phải. Núm nhiệt độ được chỉnh ở 160°C.*

Seal trong 3 giây rồi lấy ra.
```

Output `text-only.md`:
```markdown
## Bước 3: Đóng gói

Đặt túi lên máy seal như hình dưới.

Seal trong 3 giây rồi lấy ra.
```

## Yêu cầu

- Pandoc phải được cài trên server (`pandoc --version`)
- Input hỗ trợ: `.docx` (Word 2007+)
- Kích thước tối đa: 100MB

## Nén ảnh

Trước khi gửi đến AI Vision, ảnh được xử lý qua Sharp:
- Chiều rộng/cao tối đa: 1600px
- Chất lượng JPEG/PNG: 80%
- Giảm chi phí API và tăng tốc độ xử lý
