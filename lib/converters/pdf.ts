// lib/converters/pdf.ts
// PDF converter: compress → Gemini → text-only.md
// Batch 20 trang nếu dài, tối đa 5 batch (100 trang)

import fs from 'fs/promises';
import path from 'path';
import { compressPdf } from '@/lib/compress/pdf';
import { convertPdfWithAI } from '@/lib/ai/gemini';

const PAGES_PER_BATCH = 20;
const MAX_BATCHES = 5; // tối đa 100 trang

export interface PdfConvertResult {
  textOnlyMdPath: string;
  compressedSize: number;
  slug: string;
}

// Đếm trang PDF bằng cách parse binary (đơn giản, không cần thư viện ngoài)
function countPdfPages(buffer: Buffer): number {
  const content = buffer.toString('latin1');
  // Tìm /Type /Page (không phải /Pages)
  const matches = content.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

// Split PDF theo range trang dùng Ghostscript
async function splitPdfPages(
  pdfPath: string,
  outputPath: string,
  firstPage: number,
  lastPage: number
): Promise<void> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  await execFileAsync('gs', [
    '-sDEVICE=pdfwrite',
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    `-dFirstPage=${firstPage}`,
    `-dLastPage=${lastPage}`,
    `-sOutputFile=${outputPath}`,
    pdfPath,
  ]);
}

export async function convertPdf(
  pdfPath: string,
  outputDir: string,
  compressLevel: string,
  slug: string
): Promise<PdfConvertResult> {
  // Bước 1: Compress PDF với Ghostscript
  const compressedPath = path.join(outputDir, 'compressed.pdf');
  const { compressedSize } = await compressPdf(pdfPath, compressedPath, compressLevel);

  // Đếm trang
  const pdfBuffer = await fs.readFile(compressedPath);
  const pageCount = countPdfPages(pdfBuffer);

  let markdown: string;
  let truncated = false;

  if (pageCount <= PAGES_PER_BATCH || pageCount === 0) {
    // PDF ngắn hoặc không đếm được — gửi toàn bộ file
    markdown = await convertPdfWithAI(compressedPath);
  } else {
    // PDF dài — batch 20 trang
    const totalBatches = Math.min(Math.ceil(pageCount / PAGES_PER_BATCH), MAX_BATCHES);
    const parts: string[] = [];

    for (let batch = 0; batch < totalBatches; batch++) {
      const firstPage = batch * PAGES_PER_BATCH + 1;
      const lastPage = Math.min((batch + 1) * PAGES_PER_BATCH, pageCount);
      const batchPath = path.join(outputDir, `batch-${batch + 1}.pdf`);

      await splitPdfPages(compressedPath, batchPath, firstPage, lastPage);
      const batchMd = await convertPdfWithAI(batchPath);
      parts.push(batchMd);

      // Xóa file batch tạm
      await fs.unlink(batchPath).catch(() => {});
    }

    // E05: vượt quá 100 trang
    if (pageCount > MAX_BATCHES * PAGES_PER_BATCH) {
      truncated = true;
    }

    markdown = parts.join('\n\n---\n\n');
    if (truncated) {
      markdown += '\n\n> **[Lưu ý]:** Tài liệu quá dài, chỉ convert 100 trang đầu.';
    }
  }

  // Lưu text-only.md
  const textOnlyMdPath = path.join(outputDir, `${slug}-text-only.md`);
  await fs.writeFile(textOnlyMdPath, markdown, 'utf-8');

  // Xóa compressed PDF tạm (giữ file gốc)
  await fs.unlink(compressedPath).catch(() => {});

  return { textOnlyMdPath, compressedSize, slug };
}
