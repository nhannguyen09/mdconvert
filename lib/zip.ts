// lib/zip.ts
// Tạo ZIP stream từ output của conversion
// DOCX: full.md + text-only.md + images/
// PDF: text-only.md

import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export interface ZipOptions {
  conversionId: string;
  fileType: string;       // "docx" | "pdf"
  slug: string;           // dùng cho tên file trong ZIP
  fullMdPath: string | null;
  textOnlyMdPath: string;
  imagesDir: string | null;
}

export function createZipStream(options: ZipOptions): { stream: Readable; filename: string } {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `${options.slug}-${today}.zip`;

  const archive = archiver('zip', { zlib: { level: 6 } });

  // full.md (DOCX only)
  if (options.fileType === 'docx' && options.fullMdPath && fs.existsSync(options.fullMdPath)) {
    archive.file(options.fullMdPath, { name: `${options.slug}-full.md` });
  }

  // text-only.md
  if (fs.existsSync(options.textOnlyMdPath)) {
    archive.file(options.textOnlyMdPath, { name: `${options.slug}-text-only.md` });
  }

  // images/ (DOCX only — hình gốc)
  if (options.fileType === 'docx' && options.imagesDir && fs.existsSync(options.imagesDir)) {
    const files = fs.readdirSync(options.imagesDir);
    for (const file of files) {
      const imgPath = path.join(options.imagesDir, file);
      if (fs.statSync(imgPath).isFile()) {
        archive.file(imgPath, { name: `images/${file}` });
      }
    }
  }

  archive.finalize();

  return { stream: archive as unknown as Readable, filename };
}
