// lib/converters/pdf.ts
// PDF converter: compress → Gemini → text-only.md
// X2: countPdfPages dùng pdfinfo (poppler-utils) thay regex
// X1: pages_per_batch + max_pages đọc từ DB settings (không hardcode)
// X3: batch xử lý song song 3 batch / lần thay vì tuần tự

import fs from 'fs/promises';
import path from 'path';
import { compressPdf } from '@/lib/compress/pdf';
import { convertPdfWithAI } from '@/lib/ai/gemini';
import { getSetting } from '@/lib/settings';

const CONCURRENT_BATCHES = 3;

export interface PdfConvertResult {
  textOnlyMdPath: string;
  compressedSize: number;
  slug: string;
}

// ─── X2: Đếm trang dùng pdfinfo (poppler-utils) với Ghostscript fallback ──────

async function countPdfPages(pdfPath: string): Promise<number> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const execFileAsync = promisify(execFile);

  // Thử pdfinfo trước (poppler-utils)
  try {
    const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
    const match = stdout.match(/Pages:\s+(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch {
    // pdfinfo chưa cài — thử Ghostscript
  }

  // Fallback: Ghostscript
  try {
    const { stdout } = await execFileAsync('gs', [
      '-q', '-dNODISPLAY', '-dNOSAFER',
      '-c', `(${pdfPath}) (r) file runpdfbegin pdfpagecount = quit`,
    ]);
    const n = parseInt(stdout.trim(), 10);
    if (!isNaN(n)) return n;
  } catch {
    // Ghostscript cũng thất bại
  }

  // Không đếm được — trả về 0 để caller gửi toàn bộ file
  console.warn('[PDF] Không thể đếm trang — sẽ gửi toàn bộ file. Cài poppler-utils: apt install poppler-utils');
  return 0;
}

// ─── Split PDF theo range trang ────────────────────────────────────────────────

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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main converter ─────────────────────────────────────────────────────────────

export async function convertPdf(
  pdfPath: string,
  outputDir: string,
  compressLevel: string,
  slug: string,
  onProgress?: (text: string) => void
): Promise<PdfConvertResult> {
  // Bước 1: Compress PDF với Ghostscript
  const compressedPath = path.join(outputDir, 'compressed.pdf');
  const { compressedSize } = await compressPdf(pdfPath, compressedPath, compressLevel);

  // X1: Đọc settings từ DB
  const pagesPerBatch = Math.max(1, parseInt(await getSetting('pdf_pages_per_batch'), 10) || 20);
  const maxPages      = Math.max(0, parseInt(await getSetting('pdf_max_pages'), 10) || 0);

  // X2: Đếm trang đáng tin cậy
  const pageCount = await countPdfPages(compressedPath);

  let markdown: string;

  if (pageCount <= pagesPerBatch || pageCount === 0) {
    // PDF ngắn hoặc không đếm được — gửi toàn bộ file
    onProgress?.('Đang xử lý tài liệu...');
    markdown = await convertPdfWithAI(compressedPath);
  } else {
    // X1: Giới hạn trang nếu maxPages > 0
    const effectivePages = maxPages > 0 ? Math.min(pageCount, maxPages) : pageCount;
    const totalBatches   = Math.ceil(effectivePages / pagesPerBatch);
    const parts: string[] = new Array(totalBatches);

    // X3: Xử lý song song CONCURRENT_BATCHES batch mỗi lượt
    for (let i = 0; i < totalBatches; i += CONCURRENT_BATCHES) {
      const chunkIndices = Array.from(
        { length: Math.min(CONCURRENT_BATCHES, totalBatches - i) },
        (_, k) => i + k
      );

      const firstInChunk = chunkIndices[0] * pagesPerBatch + 1;
      const lastInChunk  = Math.min(
        (chunkIndices[chunkIndices.length - 1] + 1) * pagesPerBatch,
        effectivePages
      );
      onProgress?.(`Đang xử lý trang ${firstInChunk}–${lastInChunk}/${effectivePages}...`);

      const chunkResults = await Promise.allSettled(
        chunkIndices.map(async (batchIdx) => {
          const firstPage = batchIdx * pagesPerBatch + 1;
          const lastPage  = Math.min((batchIdx + 1) * pagesPerBatch, effectivePages);
          const batchPath = path.join(outputDir, `batch-${batchIdx + 1}.pdf`);

          await splitPdfPages(compressedPath, batchPath, firstPage, lastPage);
          const batchMd = await convertPdfWithAI(batchPath);
          await fs.unlink(batchPath).catch(() => {});
          return batchMd;
        })
      );

      for (let k = 0; k < chunkIndices.length; k++) {
        const r = chunkResults[k];
        parts[chunkIndices[k]] = r.status === 'fulfilled'
          ? r.value
          : `\n\n> **[Lỗi convert batch ${chunkIndices[k] + 1}]:** ${r.reason}\n\n`;
      }

      if (i + CONCURRENT_BATCHES < totalBatches) {
        await sleep(500);
      }
    }

    markdown = parts.join('\n\n---\n\n');

    // X1: Ghi note nếu bị giới hạn
    if (maxPages > 0 && pageCount > maxPages) {
      markdown += `\n\n> **[Lưu ý]:** Tài liệu có ${pageCount} trang, chỉ convert ${maxPages} trang đầu theo cấu hình. Điều chỉnh "Giới hạn trang tối đa" trong Settings để xử lý toàn bộ.`;
    }
  }

  // Lưu text-only.md
  const textOnlyMdPath = path.join(outputDir, `${slug}-text-only.md`);
  await fs.writeFile(textOnlyMdPath, markdown, 'utf-8');

  // Xóa compressed PDF tạm (giữ file gốc)
  await fs.unlink(compressedPath).catch(() => {});

  return { textOnlyMdPath, compressedSize, slug };
}
