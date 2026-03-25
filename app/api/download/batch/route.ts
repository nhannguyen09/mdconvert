// app/api/download/batch/route.ts
// POST /api/download/batch — gom tất cả output của nhiều conversions thành 1 ZIP

import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { slugify } from '@/lib/converters/docx';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { conversionIds?: string[] };
    const ids: string[] = Array.isArray(body.conversionIds) ? body.conversionIds : [];

    if (ids.length === 0) {
      return Response.json({ error: 'Thiếu conversionIds' }, { status: 400 });
    }

    const conversions = await prisma.conversion.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });

    const completed = conversions.filter(c => c.status === 'completed' && !c.filesDeleted);
    const notIncluded = conversions.filter(c => c.status !== 'completed' || c.filesDeleted);

    if (completed.length === 0) {
      return Response.json({ error: 'Không có conversion nào đã hoàn tất' }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const archive = archiver('zip', { zlib: { level: 6 } });

    for (const conv of completed) {
      const slug = slugify(conv.fileName);
      const dirPrefix = slug; // mỗi file trong thư mục riêng

      // full.md (DOCX only)
      if (conv.fullMdPath && fs.existsSync(conv.fullMdPath)) {
        archive.file(conv.fullMdPath, { name: `${dirPrefix}/${slug}-full.md` });
      }

      // text-only.md
      if (conv.textOnlyMdPath && fs.existsSync(conv.textOnlyMdPath)) {
        archive.file(conv.textOnlyMdPath, { name: `${dirPrefix}/${slug}-text-only.md` });
      }

      // images/ (DOCX only)
      if (conv.fileType === 'docx' && conv.imagesDir && fs.existsSync(conv.imagesDir)) {
        const files = fs.readdirSync(conv.imagesDir);
        for (const file of files) {
          const imgPath = path.join(conv.imagesDir, file);
          if (fs.statSync(imgPath).isFile()) {
            archive.file(imgPath, { name: `${dirPrefix}/images/${file}` });
          }
        }
      }
    }

    // _errors.txt nếu có file không included
    if (notIncluded.length > 0) {
      const lines = [
        'Các file sau không được đưa vào batch ZIP:',
        '',
        ...notIncluded.map(c => {
          const reason = c.filesDeleted
            ? 'File đã bị xóa sau 24h'
            : `Trạng thái: ${c.status}`;
          return `- ${c.fileName}: ${reason}`;
        }),
      ];
      archive.append(lines.join('\n'), { name: '_errors.txt' });
    }

    archive.finalize();

    // Convert Node.js Readable → Web ReadableStream
    const nodeReadable = archive as unknown as Readable;
    const webStream = Readable.toWeb(nodeReadable) as ReadableStream;

    const filename = `batch-${today}.zip`;

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[POST /api/download/batch]', error);
    return Response.json({ error: 'Lỗi server khi tạo ZIP' }, { status: 500 });
  }
}
