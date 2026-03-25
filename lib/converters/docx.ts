// lib/converters/docx.ts
// DOCX converter: Pandoc CLI → raw.md + images/
// Security: dùng execFile (không exec), sanitize filePath (S05)

import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execFileAsync = promisify(execFile);

// ─── Security: sanitize path ─────────────────────────────────────────────────
function sanitizePath(p: string): string {
  // execFile truyền arg như array (không qua shell) → &, space, brackets an toàn
  // Chỉ block ký tự nguy hiểm với --extract-media= flag (nối thành string)
  if (/[;|`$<>\\]/.test(p)) {
    throw new Error(`Path chứa ký tự không hợp lệ: ${p}`);
  }
  return p;
}

// ─── Slug từ tên file ─────────────────────────────────────────────────────────
export function slugify(filename: string): string {
  const name = path.basename(filename, path.extname(filename)).normalize('NFC');
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Verify pandoc tồn tại ───────────────────────────────────────────────────
async function verifyPandoc(): Promise<void> {
  try {
    await execFileAsync('pandoc', ['--version']);
  } catch {
    throw new Error('Pandoc chưa được cài đặt trên server. Chạy: brew install pandoc');
  }
}

// ─── Extract images trực tiếp từ DOCX zip ────────────────────────────────────
// Pandoc chỉ extract được image placeholder (1×1px) cho DOCX có cấu trúc phức tạp
// (mc:AlternateContent, wpg:wgp). Giải pháp: unzip DOCX, parse XML để lấy đúng ảnh theo thứ tự.
async function extractDocxImagesDirectly(
  filePath: string,
  imagesDir: string,
  slug: string,
): Promise<{ orderedNewNames: string[]; images: string[] }> {
  const tmpDir = path.join(imagesDir, '__docx_tmp');
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    // Unzip DOCX (DOCX là zip file)
    await execFileAsync('unzip', ['-o', '-q', filePath, '-d', tmpDir]);

    const imageExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff']);

    // 1. Parse word/_rels/document.xml.rels: rId → media filename
    const relsContent = await fs.readFile(
      path.join(tmpDir, 'word', '_rels', 'document.xml.rels'), 'utf-8'
    );
    const ridToFile = new Map<string, string>();
    const relRx = /Id="(rId\w+)"[^>]*Target="media\/([^"]+)"/g;
    let m;
    while ((m = relRx.exec(relsContent)) !== null) {
      if (imageExts.has(path.extname(m[2]).toLowerCase())) {
        ridToFile.set(m[1], m[2]);
      }
    }

    // 2. Parse word/document.xml: lấy danh sách a:blip r:embed theo thứ tự xuất hiện
    const docContent = await fs.readFile(
      path.join(tmpDir, 'word', 'document.xml'), 'utf-8'
    );
    const blipRx = /r:embed="(rId\w+)"/g;
    const orderedRids: string[] = [];
    while ((m = blipRx.exec(docContent)) !== null) {
      if (ridToFile.has(m[1])) orderedRids.push(m[1]);
    }

    // 3. Copy images từ word/media/ sang imagesDir, rename theo convention
    //    Dedup: cùng srcFile → cùng newName (tránh copy trùng)
    const seenMap = new Map<string, string>(); // srcFile → newName
    const images: string[] = [];
    const orderedNewNames: string[] = [];
    let counter = 1;

    for (const rId of orderedRids) {
      const srcFile = ridToFile.get(rId)!;
      if (!seenMap.has(srcFile)) {
        const ext = path.extname(srcFile).toLowerCase();
        const newName = `${slug}-img-${String(counter).padStart(3, '0')}${ext}`;
        const srcPath = path.join(tmpDir, 'word', 'media', srcFile);
        const destPath = path.join(imagesDir, newName);
        try {
          await fs.copyFile(srcPath, destPath);
          seenMap.set(srcFile, newName);
          images.push(destPath);
          counter++;
        } catch {
          // File không tồn tại trong media/ — bỏ qua
        }
      }
      const newName = seenMap.get(srcFile);
      if (newName) orderedNewNames.push(newName);
    }

    return { orderedNewNames, images };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// ─── Convert DOCX → raw.md + images/ ─────────────────────────────────────────

export interface DocxConvertResult {
  rawMdPath: string;
  imagesDir: string;
  images: string[];   // absolute paths đến hình gốc đã rename
  slug: string;
}

export async function convertDocx(
  filePath: string,
  outputDir: string,
  originalFilename: string
): Promise<DocxConvertResult> {
  await verifyPandoc();

  const safeFilePath = sanitizePath(filePath);
  const safeOutputDir = sanitizePath(outputDir);

  const slug = slugify(originalFilename);
  const rawMdPath = path.join(safeOutputDir, 'raw.md');
  const imagesExtractDir = path.join(safeOutputDir, 'images');

  await fs.mkdir(imagesExtractDir, { recursive: true });

  // Pandoc: tạo raw.md với image placeholders
  // -t markdown: xuất ![]() thay vì <img> HTML tag
  // --wrap=none: không wrap dòng
  // --extract-media: pandoc ghi image path vào raw.md (dù ảnh trích xuất sai, dùng để đếm)
  await execFileAsync('pandoc', [
    safeFilePath,
    '-t', 'markdown',
    '--wrap=none',
    `--extract-media=${imagesExtractDir}`,
    '-o', rawMdPath,
  ]);

  // Xóa images/media/ của pandoc — ta sẽ dùng ảnh extract trực tiếp từ DOCX
  await fs.rm(path.join(imagesExtractDir, 'media'), { recursive: true, force: true }).catch(() => {});

  // Extract ảnh trực tiếp từ DOCX zip, map theo thứ tự xuất hiện trong document.xml
  const { orderedNewNames, images } = await extractDocxImagesDirectly(
    safeFilePath, imagesExtractDir, slug
  );

  // Replace tất cả image placeholders trong raw.md bằng đúng ảnh theo thứ tự
  // Regex consume cả {width=... height=...} để không rò ra text
  if (orderedNewNames.length > 0) {
    let rawContent = await fs.readFile(rawMdPath, 'utf-8');
    let imgIdx = 0;
    rawContent = rawContent.replace(
      /!\[([^\]]*)\]\([^)]+\)(?:\{[^}]*\})?/g,
      (_match, alt) => {
        if (imgIdx >= orderedNewNames.length) return '';
        return `![${alt}](images/${orderedNewNames[imgIdx++]})`;
      }
    );
    await fs.writeFile(rawMdPath, rawContent, 'utf-8');
  }

  return {
    rawMdPath,
    imagesDir: imagesExtractDir,
    images,
    slug,
  };
}
