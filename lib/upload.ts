// lib/upload.ts
// Business logic cho upload: validate, normalize filename, lưu file, tạo output dir
// H1: path.basename() để chặn path traversal (../../etc/passwd)
// H3: stream write thay vì arrayBuffer() để tránh OOM với file lớn

import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import path from 'path';
import crypto from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

const ALLOWED_EXTENSIONS = ['.docx', '.pdf'] as const;

const MIME_MAP: Record<string, string> = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
};

export type CompressLevel = 'screen' | 'ebook' | 'printer' | 'prepress';
export type FileType = 'docx' | 'pdf';

// ─── Validation ───────────────────────────────────────────────────────────────

export type ValidateResult =
  | { valid: true; fileType: FileType; extension: string }
  | { valid: false; error: string };

export function validateFile(file: File): ValidateResult {
  const rawName = file.name.normalize('NFC');
  const ext = path.extname(rawName).toLowerCase();

  // E06: Reject .docm (macro-enabled Word)
  if (ext === '.docm') {
    return {
      valid: false,
      error: 'File .docm (có macro) không được hỗ trợ. Vui lòng lưu lại dạng .docx thuần.',
    };
  }

  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return {
      valid: false,
      error: `Chỉ hỗ trợ file .docx và .pdf. File bạn upload có định dạng "${ext || 'không xác định'}".`,
    };
  }

  // Check MIME type
  const expectedMime = MIME_MAP[ext];
  if (file.type && file.type !== expectedMime) {
    return {
      valid: false,
      error: `MIME type không hợp lệ. Mong đợi "${expectedMime}", nhận được "${file.type}".`,
    };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `File quá lớn (${sizeMB}MB). Giới hạn tối đa là 300MB.`,
    };
  }

  const fileType: FileType = ext === '.docx' ? 'docx' : 'pdf';

  return { valid: true, fileType, extension: ext };
}

// ─── Filename normalization ───────────────────────────────────────────────────

// H1 + E07: basename() chặn path traversal, NFC normalize cho tiếng Việt
export function normalizeFilename(name: string): string {
  // path.basename() loại bỏ mọi directory component (../../, /etc/ ...)
  return path.basename(name.normalize('NFC'));
}

// ─── File saving ──────────────────────────────────────────────────────────────

export interface SaveResult {
  conversionId: string;
  originalPath: string;
  outputDir: string;
  normalizedName: string;
}

export async function saveUploadedFile(file: File): Promise<SaveResult> {
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const outputDir = process.env.OUTPUT_DIR ?? './outputs';

  const conversionId = crypto.randomUUID();

  // H1: normalize + basename để chặn path traversal
  const normalizedName = normalizeFilename(file.name);

  // Lưu file gốc: uploads/[uuid]-[safename]
  const originalPath = path.join(uploadDir, `${conversionId}-${normalizedName}`);

  // Tạo thư mục outputs/[uuid]/ cho conversion này
  const conversionOutputDir = path.join(outputDir, conversionId);

  // Đảm bảo các thư mục tồn tại
  await fs.mkdir(path.dirname(originalPath), { recursive: true });
  await fs.mkdir(conversionOutputDir, { recursive: true });

  // H3: Stream write thay vì arrayBuffer() để tránh OOM với file lớn (300MB)
  // file.stream() → Web ReadableStream → Node.js Readable → fs WriteStream
  try {
    const readable = Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]);
    const writable = createWriteStream(originalPath);
    await pipeline(readable, writable);
  } catch {
    // Fallback: nếu stream không hoạt động (môi trường đặc biệt) → dùng arrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(originalPath, buffer);
  }

  return {
    conversionId,
    originalPath,
    outputDir: conversionOutputDir,
    normalizedName,
  };
}

// ─── CompressLevel validation ─────────────────────────────────────────────────

const VALID_COMPRESS_LEVELS: CompressLevel[] = ['screen', 'ebook', 'printer', 'prepress'];

export function parseCompressLevel(value: FormDataEntryValue | null): CompressLevel {
  if (typeof value === 'string' && VALID_COMPRESS_LEVELS.includes(value as CompressLevel)) {
    return value as CompressLevel;
  }
  return 'ebook'; // default
}
