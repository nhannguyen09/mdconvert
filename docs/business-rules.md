# Business Rules: mdconvert

## File validation

| Rule | Chi tiết |
|---|---|
| Accepted types | .docx, .pdf (check cả extension lẫn MIME type) |
| Max file size | 100MB |
| MIME docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| MIME pdf | application/pdf |
| Reject khác | Trả 400 + message "Chỉ hỗ trợ file .docx và .pdf" |

## Routing logic

```
if (fileExtension === ".docx") → DOCX flow (Pandoc + sharp + Gemini)
if (fileExtension === ".pdf")  → PDF flow (Ghostscript + Gemini)
else → reject
```

## DOCX flow rules

| Bước | Rule |
|---|---|
| Pandoc | Luôn dùng `-t markdown_strict` để tránh Pandoc thêm syntax lạ |
| Pandoc | `--extract-media` trỏ vào thư mục riêng theo conversion ID |
| sharp compress | Resize max width 1600px (giữ tỷ lệ), quality 80%, format PNG |
| sharp compress | Hình gốc GIỮ LẠI, hình compressed lưu riêng (xóa sau khi gọi AI xong) |
| Gemini | Gửi hình compressed (không gửi hình gốc HD) |
| Gemini | Delay 200ms giữa mỗi request để tránh rate limit |
| Assembler | Regex tìm `![...](...)` trong raw.md, thay bằng mô tả từ AI |
| full.md | Giữ link hình: `![mô tả ngắn](images/xxx.png)` + blockquote mô tả chi tiết |
| text-only.md | Xóa link hình, chỉ giữ blockquote mô tả chi tiết |

## PDF flow rules

| Bước | Rule |
|---|---|
| Ghostscript | 4 preset: screen (72dpi), ebook (150dpi), printer (300dpi), prepress (300+dpi) |
| Ghostscript | Mặc định: ebook. User chọn trên UI |
| Ghostscript | File gốc GIỮ LẠI, file compressed lưu riêng |
| Ghostscript | Command: `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/[preset] -dNOPAUSE -dBATCH -dQUIET -sOutputFile=[out] [in]` |
| PDF batching | Nếu PDF > 20 trang: chia batch 20 trang, gửi Gemini lần lượt, ghép markdown |
| PDF batching | Dùng qpdf hoặc pdftk để split (cài thêm trên VPS nếu cần) |
| Gemini | Gửi file PDF compressed trực tiếp (Gemini hỗ trợ PDF native) |
| Output | Chỉ text-only.md (không có full.md, không có images/) |

## Gemini API rules

| Rule | Chi tiết |
|---|---|
| Model | gemini-2.0-flash-lite (hoặc version mới nhất tại thời điểm implement) |
| Prompt hình (DOCX) | "Mô tả chi tiết hình này bằng tiếng Việt. Ghi rõ text trong hình nếu có. Mô tả vị trí, trạng thái, thao tác đang thực hiện." |
| Prompt PDF | "Convert tài liệu này sang Markdown tiếng Việt. Giữ nguyên cấu trúc heading, bảng, danh sách. Mô tả chi tiết mọi hình ảnh trong tài liệu, bao gồm text trong hình nếu có." |
| Error handling | Nếu Gemini fail 1 hình: log error, ghi "[Không thể mô tả hình này]" vào markdown, tiếp tục hình tiếp theo. Không fail toàn bộ conversion |
| Rate limit | 200ms delay giữa mỗi request |
| Timeout | 60s per request |

## Naming convention

| Item | Pattern | Ví dụ |
|---|---|---|
| Hình gốc | [slug]-img-[###].png | dong-goi-img-001.png |
| full.md | [slug]-full.md | dong-goi-full.md |
| text-only.md | [slug]-text-only.md | dong-goi-text-only.md |
| images dir | [conversion-id]/images/ | abc123/images/ |
| ZIP | [slug]-[YYYYMMDD].zip | dong-goi-20260325.zip |
| slug | Tên file gốc, lowercase, thay space bằng dash, bỏ dấu tiếng Việt | "SOP Đóng Gói.docx" → "sop-dong-goi" |

## Output format

### full.md (DOCX only)

```markdown
# Tiêu đề SOP

Nội dung text từ Pandoc...

![Vị trí đặt túi trên máy seal](images/dong-goi-img-001.png)
> *Hình cho thấy túi trà 100g được đặt ngang trên bệ máy seal,
> miệng túi hướng về phía thanh ép nhiệt, cách mép thanh ép khoảng 1cm.*

Nội dung tiếp theo...
```

### text-only.md (cả DOCX và PDF)

```markdown
# Tiêu đề SOP

Nội dung text...

> **[Hình minh họa]:** Hình cho thấy túi trà 100g được đặt ngang trên
> bệ máy seal, miệng túi hướng về phía thanh ép nhiệt, cách mép
> thanh ép khoảng 1cm.

Nội dung tiếp theo...
```

## Edit rules

| Rule | Chi tiết |
|---|---|
| Scope | User chỉ edit text-only.md và full.md. Không edit hình gốc |
| Save | PUT /api/convert/[id]/edit, body chứa markdown content |
| Lưu cả 2 | Nếu user sửa mô tả hình trong full.md, cập nhật luôn text-only.md và ngược lại |
| Version | Không lưu version history (out of scope), chỉ overwrite |
