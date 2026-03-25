// lib/assembler.ts
// Assembler: ghép raw.md + image descriptions → full.md + text-only.md
// Format theo docs/business-rules.md

import fs from 'fs/promises';
import path from 'path';

// ─── Helper: convert multi-line text → proper markdown blockquote ─────────────
// Mỗi dòng (kể cả dòng trắng) được prefix "> " để toàn bộ description nằm trong blockquote
function toBlockquote(text: string): string {
  return text
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');
}

export interface ImageDescriptionInput {
  imageName: string;       // tên file hình: dong-goi-img-001.png
  description: string;     // mô tả chi tiết tiếng Việt
  shortAlt: string;        // alt text ngắn
}

export interface AssembleResult {
  fullMdPath: string;
  textOnlyMdPath: string;
}

export async function assembleDocxOutput(
  rawMdPath: string,
  descriptions: ImageDescriptionInput[],
  slug: string,
  outputDir: string
): Promise<AssembleResult> {
  let rawContent = await fs.readFile(rawMdPath, 'utf-8');

  // Map imageName → description để tra nhanh
  const descMap = new Map<string, ImageDescriptionInput>();
  for (const d of descriptions) {
    descMap.set(d.imageName, d);
  }

  // Regex match pattern: ![alt text](images/filename.ext) với optional {width=... height=...}
  // Pandoc -t markdown thêm {width=... height=...} sau link → cần consume để không rò ra text
  const IMG_REGEX = /!\[([^\]]*)\]\((images\/[^)]+)\)(?:\{[^}]*\})?/g;

  // BUG 3 FIX: fallback cho <img src="images/..."> nếu pandoc xuất HTML tag
  const HTML_IMG_REGEX = /<img\s[^>]*src=["'](images\/[^"']+)["'][^>]*\/?>/gi;

  let fullMd = rawContent;
  let textOnlyMd = rawContent;

  // Replace trong full.md: giữ link hình + thêm blockquote mô tả
  // toBlockquote() đảm bảo multi-line description nằm hoàn toàn trong blockquote
  fullMd = fullMd.replace(IMG_REGEX, (_match, _alt, imgPath) => {
    const imgName = path.basename(imgPath);
    const desc = descMap.get(imgName);
    if (!desc) return `![Hình minh họa](${imgPath})`;
    return `![${desc.shortAlt}](${imgPath})\n${toBlockquote(desc.description)}`;
  });

  // fallback xử lý <img src="images/..."> còn sót lại
  fullMd = fullMd.replace(HTML_IMG_REGEX, (_match, imgPath) => {
    const imgName = path.basename(imgPath);
    const desc = descMap.get(imgName);
    if (!desc) return `![Hình minh họa](${imgPath})`;
    return `![${desc.shortAlt}](${imgPath})\n${toBlockquote(desc.description)}`;
  });

  // Replace trong text-only.md: xóa link hình, chỉ giữ blockquote mô tả
  textOnlyMd = textOnlyMd.replace(IMG_REGEX, (_match, _alt, imgPath) => {
    const imgName = path.basename(imgPath);
    const desc = descMap.get(imgName);
    if (!desc) return '> **[Hình minh họa]:** *(Không có mô tả)*';
    return toBlockquote(desc.description);
  });

  // fallback xử lý <img src="images/..."> còn sót lại
  textOnlyMd = textOnlyMd.replace(HTML_IMG_REGEX, (_match, imgPath) => {
    const imgName = path.basename(imgPath);
    const desc = descMap.get(imgName);
    if (!desc) return '> **[Hình minh họa]:** *(Không có mô tả)*';
    return toBlockquote(desc.description);
  });

  // Lưu file output
  const fullMdPath = path.join(outputDir, `${slug}-full.md`);
  const textOnlyMdPath = path.join(outputDir, `${slug}-text-only.md`);

  await fs.writeFile(fullMdPath, fullMd, 'utf-8');
  await fs.writeFile(textOnlyMdPath, textOnlyMd, 'utf-8');

  return { fullMdPath, textOnlyMdPath };
}

// E01: DOCX không có hình → full.md = text-only.md = raw.md
export async function assembleDocxNoImages(
  rawMdPath: string,
  slug: string,
  outputDir: string
): Promise<AssembleResult> {
  const rawContent = await fs.readFile(rawMdPath, 'utf-8');

  const fullMdPath = path.join(outputDir, `${slug}-full.md`);
  const textOnlyMdPath = path.join(outputDir, `${slug}-text-only.md`);

  await fs.writeFile(fullMdPath, rawContent, 'utf-8');
  await fs.writeFile(textOnlyMdPath, rawContent, 'utf-8');

  return { fullMdPath, textOnlyMdPath };
}
