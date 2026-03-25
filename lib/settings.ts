// lib/settings.ts
// Read/write AppSetting from DB. Used by AI wrapper and Settings API.

import { prisma } from './prisma';
import { encrypt, decrypt } from './crypto';

// ─── Prompt presets ────────────────────────────────────────────────────────────
// Two built-in presets: English (default) and Vietnamese.
// Users can freely edit the prompts after selecting a preset.

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
    pdf: `Convert this document to Markdown. Preserve heading structure, tables, and lists.

For each image in the document, replace with a detailed description block:
> **[Image]:** [detailed description]

Include: image type, software name if screenshot, all visible text, and required actions if applicable.

Output clean Markdown with proper heading hierarchy (h1, h2, h3).`,
  },
  vi: {
    image: `Bạn là trợ lý mô tả hình ảnh cho tài liệu SOP (quy trình nội bộ). Mô tả chi tiết hình ảnh này bằng tiếng Việt theo cấu trúc sau:

1. Một câu tóm tắt ngắn về nội dung tổng thể của hình.
2. Mô tả chi tiết các thành phần chính: tên màn hình/giao diện, các nút bấm, menu, bảng dữ liệu, trường nhập liệu.
3. Ghi rõ tất cả text/số liệu hiển thị trong hình (tên cột, giá trị, nhãn nút).
4. Mô tả trạng thái hiện tại và thao tác mà người dùng đang thực hiện hoặc cần thực hiện.

Nếu hình trắng hoặc không có nội dung rõ ràng, chỉ ghi: "[Hình không có nội dung]".`,
    pdf: `Convert tài liệu này sang Markdown tiếng Việt. Giữ nguyên cấu trúc heading, bảng, danh sách. Mô tả chi tiết mọi hình ảnh trong tài liệu, bao gồm text trong hình nếu có.`,
  },
} as const;

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const SETTING_DEFAULTS: Record<string, string> = {
  ai_provider: 'gemini',
  ai_api_key: '',
  ai_model: 'gemini-2.0-flash-lite',
  ai_image_prompt: PROMPT_PRESETS.en.image,
  ai_pdf_prompt:   PROMPT_PRESETS.en.pdf,
};

const ENCRYPTED_KEYS = new Set(['ai_api_key']);

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return SETTING_DEFAULTS[key] ?? '';

  if (ENCRYPTED_KEYS.has(key) && row.value) {
    try {
      return decrypt(row.value);
    } catch {
      return '';
    }
  }
  return row.value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany();
  const result: Record<string, string> = { ...SETTING_DEFAULTS };

  for (const row of rows) {
    if (ENCRYPTED_KEYS.has(row.key) && row.value) {
      try {
        result[row.key] = decrypt(row.value);
      } catch {
        result[row.key] = '';
      }
    } else {
      result[row.key] = row.value;
    }
  }
  return result;
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function setSetting(key: string, value: string): Promise<void> {
  const stored = ENCRYPTED_KEYS.has(key) && value ? encrypt(value) : value;
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: stored },
    create: { key, value: stored },
  });
}

export async function setSettings(updates: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) => setSetting(key, value))
  );
}
