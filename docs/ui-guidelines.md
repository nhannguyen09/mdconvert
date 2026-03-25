# UI Guidelines: mdconvert

## Design Tokens

| Token | Giá trị |
|---|---|
| Primary | Navy #1A428A |
| Accent | Teal #3CABD2 |
| Background | White #FFFFFF |
| Surface | #F8FAFC |
| Text primary | #111827 |
| Text secondary | #6B7280 |
| Border | #E5E7EB |
| Success | #10B981 |
| Error | #EF4444 |
| Warning | #F59E0B |
| Border radius | 8px |
| Theme | LUÔN light theme |

## Font Stack

| Font | Dùng cho |
|---|---|
| Plus Jakarta Sans | Headings |
| DM Sans | Body text |
| Be Vietnam Pro | Tiếng Việt fallback |

## Component Patterns

### Upload Area

| Thuộc tính | Giá trị |
|---|---|
| Kiểu | Drag-and-drop zone + click to browse |
| Border | Dashed, 2px, #E5E7EB, border-radius 12px |
| Hover | Border đổi sang Accent #3CABD2 |
| Icon | Lucide Upload |
| Text | "Kéo thả file .docx hoặc .pdf vào đây" |
| Subtext | "hoặc click để chọn file (tối đa 100MB)" |

### Compress Selector (chỉ hiện khi upload PDF)

| Thuộc tính | Giá trị |
|---|---|
| Kiểu | Radio group ngang |
| Options | Screen (72 DPI), Ebook (150 DPI) [mặc định], Printer (300 DPI), Prepress (gốc) |
| Mỗi option hiển thị | Tên + DPI + mô tả 1 dòng |

### Status Badge

| Status | Màu | Text |
|---|---|---|
| pending | Gray | Chờ xử lý |
| compressing | Blue | Đang nén |
| processing | Accent | Đang convert |
| completed | Success | Hoàn tất |
| failed | Error | Lỗi |

### Markdown Preview

| Thuộc tính | Giá trị |
|---|---|
| Container | White background, border 1px #E5E7EB, padding 24px |
| Typography | Prose style (tailwind @tailwindcss/typography) |
| Code blocks | Background #F3F4F6, monospace font |
| Tables | Border collapse, zebra striping |

### History Table

| Thuộc tính | Giá trị |
|---|---|
| Columns | Tên file, Loại, Dung lượng gốc, Sau nén, Số hình, Status, Ngày, Actions |
| Sort mặc định | Ngày mới nhất trước |
| Actions | Xem, Download, Xóa |
| Empty state | "Chưa có conversion nào. Upload file để bắt đầu." |

## Layout

| Thuộc tính | Giá trị |
|---|---|
| Max width | 1200px |
| Sidebar | Không (tool đơn giản, dùng top nav) |
| Nav items | Trang chủ, Lịch sử, Đăng xuất |
| Logo | mdconvert |
| Responsive | Desktop-first, hỗ trợ tablet |
