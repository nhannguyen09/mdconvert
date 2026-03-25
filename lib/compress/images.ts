// lib/compress/images.ts
// Image compressor: sharp resize max 1600px, quality 80%, output PNG
// Hình gốc GIỮ LẠI, hình compressed lưu riêng vào images-compressed/

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const MAX_WIDTH = 1600;
const QUALITY = 80;

export interface CompressImagesResult {
  originalPaths: string[];
  compressedPaths: string[];
}

export async function compressImages(
  imagePaths: string[],
  outputDir: string
): Promise<CompressImagesResult> {
  const compressedDir = path.join(outputDir, 'images-compressed');
  await fs.mkdir(compressedDir, { recursive: true });

  const compressedPaths: string[] = [];

  for (const imgPath of imagePaths) {
    const filename = path.basename(imgPath);
    const compressedPath = path.join(compressedDir, filename);

    const image = sharp(imgPath);
    const metadata = await image.metadata();

    const width = metadata.width ?? 0;

    // Nếu hình < 1600px: không resize, chỉ compress quality
    const pipeline =
      width > MAX_WIDTH
        ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
        : image;

    await pipeline
      .png({ quality: QUALITY, compressionLevel: 6 })
      .toFile(compressedPath);

    compressedPaths.push(compressedPath);
  }

  return {
    originalPaths: imagePaths,
    compressedPaths,
  };
}

// Xóa thư mục images-compressed/ sau khi AI đã xử lý xong
export async function cleanupCompressed(outputDir: string): Promise<void> {
  const compressedDir = path.join(outputDir, 'images-compressed');
  try {
    await fs.rm(compressedDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
