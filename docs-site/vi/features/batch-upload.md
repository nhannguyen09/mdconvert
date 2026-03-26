# Upload hàng loạt

## Tổng quan

Trang upload hàng loạt (`/batch`) cho phép convert nhiều file trong một phiên. Mỗi file được xử lý độc lập và theo dõi riêng biệt.

## Cách dùng

1. Vào `/batch`
2. Kéo thả hoặc chọn nhiều file `.docx` hoặc `.pdf`
3. Với mỗi PDF, chọn mức nén (hoặc dùng mặc định)
4. Nhấn **Convert All**
5. Theo dõi tiến trình từng file
6. Tải về từng file riêng lẻ hoặc tất cả cùng lúc trong một ZIP

## Theo dõi tiến trình

Mỗi file hiển thị trạng thái riêng:

| Trạng thái | Ý nghĩa |
|---|---|
| `pending` | Đang chờ xử lý |
| `compressing` | Ghostscript (PDF) hoặc Sharp (ảnh DOCX) đang chạy |
| `processing` | Đang gọi AI Vision API |
| `completed` | Xong — sẵn sàng tải về |
| `failed` | Lỗi — xem thông báo lỗi |

## Tải về hàng loạt

Khi tất cả file hoàn tất, nhấn **Download All** để tải về một ZIP chứa tất cả output, được tổ chức theo từng lần convert.

## Giới hạn

- Kích thước tối đa mỗi file: 100MB
- Không giới hạn cứng số lượng file mỗi batch, nhưng batch lớn có thể mất thời gian tùy server và rate limit của AI provider
