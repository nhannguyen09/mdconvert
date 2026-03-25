// lib/compress/pdf.ts
// PDF compressor: Ghostscript CLI với 4 preset (screen/ebook/printer/prepress)
// Security: execFile (không exec), sanitize path (S05)

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

export type CompressLevel = 'screen' | 'ebook' | 'printer' | 'prepress';
const VALID_LEVELS = new Set<string>(['screen', 'ebook', 'printer', 'prepress']);

function sanitizePath(p: string): string {
  // execFile truyền arg như array (không qua shell) → &, space, brackets an toàn
  if (/[;|`$<>\\]/.test(p)) {
    throw new Error(`Path chứa ký tự không hợp lệ: ${p}`);
  }
  return p;
}

async function verifyGhostscript(): Promise<void> {
  try {
    await execFileAsync('gs', ['--version']);
  } catch {
    throw new Error('Ghostscript chưa được cài đặt trên server. Chạy: brew install ghostscript');
  }
}

export interface CompressPdfResult {
  compressedPath: string;
  originalSize: number;
  compressedSize: number;
}

export async function compressPdf(
  pdfPath: string,
  outputPath: string,
  level: string = 'ebook'
): Promise<CompressPdfResult> {
  await verifyGhostscript();

  const preset: CompressLevel = VALID_LEVELS.has(level) ? (level as CompressLevel) : 'ebook';
  const safePdfPath = sanitizePath(pdfPath);
  const safeOutputPath = sanitizePath(outputPath);

  const originalStat = await fs.stat(safePdfPath);
  const originalSize = originalStat.size;

  await execFileAsync('gs', [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${preset}`,
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    `-sOutputFile=${safeOutputPath}`,
    safePdfPath,
  ]);

  const compressedStat = await fs.stat(safeOutputPath);
  const compressedSize = compressedStat.size;

  return { compressedPath: safeOutputPath, originalSize, compressedSize };
}
