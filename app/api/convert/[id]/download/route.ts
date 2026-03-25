// app/api/convert/[id]/download/route.ts
// GET /api/convert/[id]/download — stream ZIP file

import { prisma } from '@/lib/prisma';
import { createZipStream } from '@/lib/zip';
import { slugify } from '@/lib/converters/docx';
import { Readable } from 'stream';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const conversion = await prisma.conversion.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!conversion) {
      return Response.json({ error: 'Conversion không tồn tại' }, { status: 404 });
    }

    if (conversion.status !== 'completed') {
      return Response.json(
        { error: 'Conversion chưa hoàn tất, không thể download' },
        { status: 400 }
      );
    }

    if (!conversion.textOnlyMdPath) {
      return Response.json({ error: 'Output file không tồn tại' }, { status: 404 });
    }

    const slug = slugify(conversion.fileName);

    const { stream, filename } = createZipStream({
      conversionId: conversion.id,
      fileType: conversion.fileType,
      slug,
      fullMdPath: conversion.fullMdPath,
      textOnlyMdPath: conversion.textOnlyMdPath,
      imagesDir: conversion.imagesDir,
    });

    // Convert Node.js Readable → Web ReadableStream
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GET /api/convert/[id]/download]', error);
    return Response.json({ error: 'Lỗi server khi tạo ZIP' }, { status: 500 });
  }
}
