# Chuyển đổi PDF

## Luồng xử lý

```
.pdf
  │
  ▼
Ghostscript CLI
  → nén PDF (giảm kích thước file)
  → preset: screen / ebook / printer / prepress
  │
  ▼
AI Vision (Gemini / OpenAI / Anthropic)
  → đọc trực tiếp các trang PDF
  → trích xuất text, bảng biểu và mô tả nội dung hình ảnh
  │
  ▼
text-only.md
```

## Output

Convert PDF chỉ tạo ra một file `text-only.md`. Không có `full.md` hay thư mục `images/` — AI Vision đọc trực tiếp từ các trang được render.

## Mức nén Ghostscript

Chọn mức nén khi upload:

| Mức | DPI | Khi nào dùng |
|---|---|---|
| `screen` | 72 dpi | Nhỏ nhất, chỉ dùng xem màn hình |
| `ebook` | 150 dpi | Cân bằng tốt — **khuyến nghị** |
| `printer` | 300 dpi | Chất lượng cao để in |
| `prepress` | 300 dpi | Chất lượng tối đa, file lớn nhất |

File PDF sau khi nén là file tạm — chỉ dùng để gửi lên AI và sẽ bị xóa sau khi convert xong.

## Yêu cầu

- Ghostscript phải được cài trên server (`gs --version`)
- Input hỗ trợ: `.pdf`
- Kích thước tối đa: 100MB

## Giới hạn

- Convert PDF chỉ cho **output text** — không trích xuất hình ảnh
- Với PDF có sơ đồ phức tạp, AI Vision mô tả nội dung nhìn thấy nhưng độ chính xác phụ thuộc vào provider và chất lượng scan
- PDF scan (chỉ có ảnh) hoạt động được nhưng chất lượng phụ thuộc vào độ phân giải
