// lib/prompt-presets.ts
// M3: Single source of truth cho prompt presets (EN + VI)
// Import file này trong cả lib/settings.ts (server) và components/SettingsForm.tsx (client)

export const PROMPT_PRESETS = {
  en: {
    image: `You are describing an image from an internal SOP (Standard Operating Procedure) document. Purpose: to help AI agents guide employees through procedures without seeing the original image.

Describe in detail using this structure:

1. IMAGE TYPE: Screenshot of software, process diagram, real photo, or table/chart.

2. MAIN CONTENT:
   - If software screenshot: app name, current screen, data fields, sample values, highlighted buttons or arrows.
   - If process diagram: list each step in order with arrow directions.
   - If real photo: describe objects, positions, conditions.
   - If table/chart: list column headers and sample rows.

3. TEXT IN IMAGE: Transcribe ALL visible text exactly as shown, especially labels, titles, values, button names.

4. ACTION REQUIRED: If the image illustrates a specific action, describe exactly what to click/type/select and where.

Do not add personal opinions. Do not guess information not visible in the image.`,

    pdf: `Convert this PDF document to clean Markdown. Preserve structure, tables, and lists.

IMPORTANT — Structure rules:
- Analyze the table of contents (if present) to determine correct heading hierarchy
- Main headings (chapters/sections): use # or ##
- Sub-headings: use ### or ####
- Preserve numbering exactly: 1, 1.1, 1.2, 2, 2.1...
- Repeated headers/footers on each page: SKIP, do not repeat in output
- Mark original page numbers with <!-- Page X --> for reference
- Keep hyperlinks if present

For each image in the document:
> **[Image]:** [detailed description including visible text, layout, and purpose]

Output: clean Markdown only. No preamble, no postscript.`,
  },

  vi: {
    image: `Bạn là trợ lý mô tả hình ảnh cho tài liệu SOP (quy trình nội bộ). Mô tả chi tiết hình ảnh này bằng tiếng Việt theo cấu trúc sau:

1. Một câu tóm tắt ngắn về nội dung tổng thể của hình.
2. Mô tả chi tiết các thành phần chính: tên màn hình/giao diện, các nút bấm, menu, bảng dữ liệu, trường nhập liệu.
3. Ghi rõ tất cả text/số liệu hiển thị trong hình (tên cột, giá trị, nhãn nút).
4. Mô tả trạng thái hiện tại và thao tác mà người dùng đang thực hiện hoặc cần thực hiện.

Nếu hình trắng hoặc không có nội dung rõ ràng, chỉ ghi: "[Hình không có nội dung]".`,

    pdf: `Convert tài liệu PDF này sang Markdown tiếng Việt. Giữ nguyên cấu trúc, bảng biểu, danh sách.

QUAN TRỌNG — Quy tắc cấu trúc:
- Phân tích mục lục (nếu có) để xác định heading hierarchy chính xác
- Heading chính (chương/phần): dùng # hoặc ##
- Heading phụ (mục con): dùng ### hoặc ####
- Giữ đúng số thứ tự mục: 1, 1.1, 1.2, 2, 2.1...
- Header/footer lặp lại mỗi trang: BỎ QUA, không lặp trong output
- Đánh dấu số trang gốc bằng <!-- Page X --> để tham chiếu
- Giữ nguyên hyperlink nếu có

Với mỗi hình ảnh trong tài liệu:
> **[Hình ảnh]:** [mô tả chi tiết bao gồm text hiển thị, bố cục, và mục đích]

Output: chỉ Markdown sạch. Không có phần mở đầu hay kết thúc thừa.`,
  },
} as const;

export type PromptLang = keyof typeof PROMPT_PRESETS;
