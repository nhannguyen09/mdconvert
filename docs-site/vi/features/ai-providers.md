# AI Providers

mdconvert hỗ trợ ba AI Vision provider. Bạn có thể chuyển đổi bất kỳ lúc nào từ trang **Settings** — không cần khởi động lại server.

## Provider được hỗ trợ

### Google Gemini

| Thông tin | Giá trị |
|---|---|
| Lấy API key | [aistudio.google.com](https://aistudio.google.com/) |
| Model khuyến nghị | `gemini-1.5-flash` |
| Ghi chú | Nhanh và tiết kiệm chi phí. Provider mặc định. |

### OpenAI

| Thông tin | Giá trị |
|---|---|
| Lấy API key | [platform.openai.com](https://platform.openai.com/) |
| Model khuyến nghị | `gpt-4o` |
| Ghi chú | Khả năng vision mạnh. Chi phí cao hơn Gemini. |

### Anthropic

| Thông tin | Giá trị |
|---|---|
| Lấy API key | [console.anthropic.com](https://console.anthropic.com/) |
| Model khuyến nghị | `claude-3-5-sonnet-20241022` |
| Ghi chú | Tốt nhất cho tài liệu phức tạp. |

## Bảo mật

API key nhập trong UI được **mã hóa AES-256** trước khi lưu vào database. Biến `ENCRYPTION_KEY` (32 ký tự) được dùng làm khóa mã hóa.

Key đặt qua biến môi trường (`GEMINI_API_KEY`) sẽ được ưu tiên hơn key nhập trong UI cho Gemini.

## Cách chuyển đổi provider

1. Vào **Settings** (`/settings`)
2. Chọn provider từ dropdown
3. Nhập API key
4. Nhấn **Save**
5. Test kết nối bằng nút **Test**

Thay đổi có hiệu lực ngay lập tức — không ảnh hưởng đến các lần convert đang chạy.

## Tùy chỉnh Prompt

Bạn có thể tùy chỉnh prompt gửi đến AI trong Settings. Có hai preset sẵn:

- **English** — output mô tả hình ảnh và Markdown bằng tiếng Anh
- **Vietnamese** — output bằng tiếng Việt

Hoặc viết prompt riêng cho thuật ngữ chuyên ngành của bạn.
