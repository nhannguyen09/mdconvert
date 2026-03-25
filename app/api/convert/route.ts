// app/api/convert/route.ts
// POST /api/convert — trigger async conversion pipeline
// Response ngay 200, pipeline chạy async (client poll status)

import { prisma } from '@/lib/prisma';
import { convertDocx, slugify } from '@/lib/converters/docx';
import { convertPdf } from '@/lib/converters/pdf';
import { compressImages, cleanupCompressed } from '@/lib/compress/images';
import { describeImages } from '@/lib/ai/gemini';
import { assembleDocxOutput, assembleDocxNoImages } from '@/lib/assembler';
import path from 'path';
import sharp from 'sharp';

// ─── Async pipeline helpers ───────────────────────────────────────────────────

async function updateStatus(id: string, status: string, extra?: Record<string, unknown>) {
  await prisma.conversion.update({ where: { id }, data: { status, ...extra } });
}

async function runDocxPipeline(conversionId: string, originalPath: string, fileName: string) {
  const outputDir = path.join(process.env.OUTPUT_DIR ?? './outputs', conversionId);
  const slug = slugify(fileName);

  try {
    // a. Pandoc convert
    const { rawMdPath, images } = await convertDocx(originalPath, outputDir, fileName);
    await updateStatus(conversionId, 'processing');

    if (images.length === 0) {
      // E01: không có hình
      const { fullMdPath, textOnlyMdPath } = await assembleDocxNoImages(rawMdPath, slug, outputDir);
      await prisma.conversion.update({
        where: { id: conversionId },
        data: {
          fullMdPath,
          textOnlyMdPath,
          imagesDir: path.join(outputDir, 'images'),
          imageCount: 0,
          status: 'completed',
        },
      });
      return;
    }

    // b. Compress images
    const { compressedPaths } = await compressImages(images, outputDir);

    // c. Classify images: tiny (skip AI) vs real (gửi Gemini)
    const TINY_THRESHOLD = 10;

    type ImageTask = {
      imageName: string;
      imagePath: string;       // original path
      compressedPath: string;
      isTiny: boolean;
    };

    // Check kích thước song song (nhanh, không gọi API)
    const tasks: ImageTask[] = await Promise.all(
      images.map(async (imgPath, i) => {
        let isTiny = false;
        try {
          const meta = await sharp(imgPath).metadata();
          isTiny = (meta.width ?? 999) <= TINY_THRESHOLD || (meta.height ?? 999) <= TINY_THRESHOLD;
        } catch { /* đọc metadata fail → cứ describe bình thường */ }
        return {
          imageName: path.basename(imgPath),
          imagePath: imgPath,
          compressedPath: compressedPaths[i],
          isTiny,
        };
      })
    );

    // Chỉ gửi ảnh thật lên Gemini
    const realTasks = tasks.filter(t => !t.isTiny);
    const realPaths = realTasks.map(t => t.compressedPath);
    const total = realPaths.length;

    await updateStatus(conversionId, 'processing', {
      progressText: `Đang mô tả hình 0/${total}...`,
    });

    // Gọi Gemini song song (chunk 5, delay 300ms giữa chunk)
    const aiResults = await describeImages(
      realPaths,
      5,
      async (done) => {
        await prisma.conversion.update({
          where: { id: conversionId },
          data: { progressText: `Đang mô tả hình ${done}/${total}...` },
        });
      }
    );

    // Ghép kết quả: tiny → placeholder, real → aiResults theo thứ tự
    const descriptions = [];
    let aiIdx = 0;

    for (const task of tasks) {
      const result = task.isTiny
        ? { description: '[Logo hoặc hình trang trí nhỏ]', shortAlt: 'Logo' }
        : (aiResults[aiIdx++] ?? { description: '[Không thể mô tả hình này]', shortAlt: 'Hình minh họa' });

      descriptions.push({ imageName: task.imageName, ...result });

      await prisma.imageDescription.create({
        data: {
          conversionId,
          imageName: task.imageName,
          imagePath: task.imagePath,
          description: result.description,
          shortAlt: result.shortAlt,
        },
      });
    }

    // d. Cleanup compressed images
    await cleanupCompressed(outputDir);

    // e. Assemble full.md + text-only.md
    const { fullMdPath, textOnlyMdPath } = await assembleDocxOutput(
      rawMdPath,
      descriptions,
      slug,
      outputDir
    );

    // f. Update Conversion record
    await prisma.conversion.update({
      where: { id: conversionId },
      data: {
        fullMdPath,
        textOnlyMdPath,
        imagesDir: path.join(outputDir, 'images'),
        imageCount: images.length,
        status: 'completed',
        progressText: null,   // clear khi xong
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.conversion.update({
      where: { id: conversionId },
      data: { status: 'failed', errorMessage: msg },
    });
  }
}

async function runPdfPipeline(
  conversionId: string,
  originalPath: string,
  fileName: string,
  compressLevel: string
) {
  const outputDir = path.join(process.env.OUTPUT_DIR ?? './outputs', conversionId);
  const slug = slugify(fileName);

  try {
    const { textOnlyMdPath, compressedSize } = await convertPdf(
      originalPath,
      outputDir,
      compressLevel,
      slug
    );

    await prisma.conversion.update({
      where: { id: conversionId },
      data: {
        textOnlyMdPath,
        compressedSize,
        status: 'completed',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.conversion.update({
      where: { id: conversionId },
      data: { status: 'failed', errorMessage: msg },
    });
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json() as { conversionId?: string; conversionIds?: string[] };

    // Normalize: hỗ trợ cả conversionId (đơn) và conversionIds[] (batch)
    const ids: string[] = [];
    if (Array.isArray(body.conversionIds) && body.conversionIds.length > 0) {
      ids.push(...body.conversionIds);
    } else if (body.conversionId) {
      ids.push(body.conversionId);
    }

    if (ids.length === 0) {
      return Response.json({ error: 'Thiếu conversionId hoặc conversionIds' }, { status: 400 });
    }

    // Validate tất cả conversions tồn tại và pending
    const conversions = await prisma.conversion.findMany({
      where: { id: { in: ids } },
    });

    const found = new Map(conversions.map(c => [c.id, c]));
    const started: string[] = [];
    const skipped: { id: string; reason: string }[] = [];

    for (const id of ids) {
      const conv = found.get(id);
      if (!conv) {
        skipped.push({ id, reason: 'Không tồn tại' });
        continue;
      }
      if (conv.status !== 'pending') {
        skipped.push({ id, reason: `Đang ở trạng thái "${conv.status}"` });
        continue;
      }
      await updateStatus(id, 'compressing');
      started.push(id);
    }

    if (started.length === 0) {
      return Response.json({ error: 'Không có conversion nào ở trạng thái pending', skipped }, { status: 400 });
    }

    // Chạy tuần tự async (không await ở đây — client poll status)
    // Mỗi file xong mới bắt đầu file tiếp, tránh quá tải Gemini
    const runSequential = async () => {
      for (const id of started) {
        const conv = found.get(id)!;
        if (conv.fileType === 'docx') {
          await runDocxPipeline(id, conv.originalPath, conv.fileName);
        } else {
          await runPdfPipeline(id, conv.originalPath, conv.fileName, conv.compressLevel ?? 'ebook');
        }
      }
    };

    runSequential().catch(err => console.error('[Batch pipeline unhandled]', err));

    // Backward compat: 1 file → trả format cũ
    if (ids.length === 1 && started.length === 1) {
      return Response.json({ id: started[0], status: 'compressing' });
    }

    return Response.json({
      started,
      skipped,
      status: 'compressing',
    });
  } catch (error) {
    console.error('[POST /api/convert]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
