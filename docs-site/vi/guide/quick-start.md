# Bắt đầu nhanh

## 1. Lần chạy đầu — Setup Wizard

Sau khi khởi động mdconvert lần đầu, mở:

```
http://localhost:2023/setup
```

Tạo tài khoản admin (email + mật khẩu). Trang này chỉ hiển thị khi chưa có user nào trong database — các lần sau sẽ tự chuyển về trang đăng nhập.

## 2. Cấu hình AI Provider

Vào **Cài đặt** (`/settings`) và chọn AI provider:

| Provider | API key cần thiết |
|---|---|
| Google Gemini | `GEMINI_API_KEY` (hoặc nhập trong UI) |
| OpenAI | Nhập API key trong Settings |
| Anthropic | Nhập API key trong Settings |

Key nhập trong UI được mã hóa AES-256 trước khi lưu vào database.

Bạn có thể tùy chỉnh prompt AI hoặc chọn preset ngôn ngữ (Tiếng Anh / Tiếng Việt).

## 3. Upload file đầu tiên

Vào trang chủ (`/`) và:

1. Kéo thả hoặc chọn file `.docx` hoặc `.pdf` (tối đa 100MB)
2. Với PDF: chọn mức nén (khuyến nghị dùng ebook)
3. Nhấn **Convert**

Quá trình convert chạy nền. Trang tự động cập nhật trạng thái.

## 4. Xem và tải về

Sau khi convert xong:

- **Preview** kết quả Markdown
- **Sửa** trực tiếp nếu cần
- **Tải về** ZIP chứa tất cả file output

### Output DOCX

```
[tên-file]-YYYYMMDD.zip
├── [tên-file]-full.md        ← text + mô tả hình ảnh
├── [tên-file]-text-only.md   ← chỉ text
└── images/
    ├── [tên-file]-img-001.png
    └── ...
```

### Output PDF

```
[tên-file]-YYYYMMDD.zip
└── [tên-file]-text-only.md
```

## 5. Upload hàng loạt

Vào `/batch` để upload nhiều file cùng lúc. Mỗi file được xử lý độc lập và có thể tải về tất cả kết quả trong một ZIP.

## 6. Lịch sử

Vào `/history` để xem tất cả lần convert trước, tải lại kết quả hoặc xóa.
