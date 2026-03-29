// lib/cleanup.ts
// Auto cleanup: xóa file uploads + outputs sau 24h, giữ Conversion record trong DB

import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';

const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 giờ

// ─── getDirSize: tính dung lượng thư mục đệ quy ──────────────────────────────
async function getDirSize(dirPath: string): Promise<number> {
  let size = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += await getDirSize(p);
      } else {
        try {
          const stat = await fs.stat(p);
          size += stat.size;
        } catch { /* bỏ qua file lỗi */ }
      }
    }
  } catch { /* thư mục không tồn tại */ }
  return size;
}

// ─── isSafePath: kiểm tra path nằm trong thư mục cho phép ────────────────────
function isSafePath(filePath: string, allowedDir: string): boolean {
  const resolved = path.resolve(filePath);
  const allowedResolved = path.resolve(allowedDir);
  return resolved.startsWith(allowedResolved + path.sep) || resolved === allowedResolved;
}

// ─── cleanupExpiredFiles ──────────────────────────────────────────────────────
export async function cleanupExpiredFiles(): Promise<{ deleted: number; freedMB: number }> {
  const cutoff = new Date(Date.now() - EXPIRY_MS);
  const outputDir = process.env.OUTPUT_DIR ?? './outputs';
  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

  const expired = await prisma.conversion.findMany({
    where: {
      createdAt: { lt: cutoff },
      filesDeleted: false,
      deletedAt: null,
    },
    select: {
      id: true,
      originalPath: true,
    },
  });

  let freed = 0;
  let deleted = 0;

  for (const conv of expired) {
    try {
      // Xóa thư mục outputs/[uuid]/
      const convOutputDir = path.join(outputDir, conv.id);
      freed += await getDirSize(convOutputDir);
      await fs.rm(convOutputDir, { recursive: true, force: true });

      // Xóa file upload gốc — chỉ xóa nếu path nằm trong uploadDir (H4)
      if (conv.originalPath) {
        if (!isSafePath(conv.originalPath, uploadDir)) {
          console.warn(`[Cleanup] Bỏ qua path không hợp lệ: ${conv.originalPath}`);
        } else {
          try {
            const stat = await fs.stat(conv.originalPath);
            freed += stat.size;
          } catch { /* file đã bị xóa trước */ }
          await fs.rm(conv.originalPath, { force: true });
        }
      }

      // Đánh dấu filesDeleted trong DB (giữ record)
      await prisma.conversion.update({
        where: { id: conv.id },
        data: { filesDeleted: true },
      });

      deleted++;
    } catch (err) {
      console.error(`[Cleanup] Failed for ${conv.id}:`, err);
    }
  }

  const freedMB = Math.round((freed / 1024 / 1024) * 100) / 100;
  if (deleted > 0) {
    console.log(`[Cleanup] Đã xóa ${deleted} conversions, giải phóng ${freedMB} MB`);
  }

  return { deleted, freedMB };
}
