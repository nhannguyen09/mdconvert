// app/api/convert/[id]/route.ts
// GET /api/convert/[id] — lấy kết quả conversion
// C2: ownership check — chỉ trả về conversion của chính user đang login
// M5: ?lite=true — chỉ trả metadata, bỏ markdown content (dùng khi polling)

import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/auth-helpers';
import fs from 'fs/promises';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();

    const conversion = await prisma.conversion.findFirst({
      where: { id: params.id, createdBy: userId, deletedAt: null },
      include: { imageDescriptions: true },
    });

    if (!conversion) {
      return Response.json({ error: 'Conversion không tồn tại' }, { status: 404 });
    }

    // M5: ?lite=true — chỉ trả metadata, không trả markdown content (dùng cho polling)
    const url = new URL(req.url);
    const lite = url.searchParams.get('lite') === 'true';

    let fullMd: string | null = null;
    let textOnlyMd: string | null = null;

    if (!lite && conversion.status === 'completed') {
      if (conversion.fullMdPath) {
        fullMd = await fs.readFile(conversion.fullMdPath, 'utf-8').catch(() => null);
      }
      if (conversion.textOnlyMdPath) {
        textOnlyMd = await fs.readFile(conversion.textOnlyMdPath, 'utf-8').catch(() => null);
      }
    }

    return Response.json({
      id: conversion.id,
      fileName: conversion.fileName,
      fileType: conversion.fileType,
      fileSize: conversion.fileSize,
      compressLevel: conversion.compressLevel,
      compressedSize: conversion.compressedSize,
      status: conversion.status,
      progressText: conversion.progressText,
      filesDeleted: conversion.filesDeleted,
      errorMessage: conversion.errorMessage,
      imageCount: conversion.imageCount,
      fullMd,
      textOnlyMd,
      // lite mode: bỏ images array để giảm response size khi polling
      images: lite ? [] : conversion.imageDescriptions.map(img => ({
        id: img.id,
        imageName: img.imageName,
        shortAlt: img.shortAlt,
        description: img.description,
      })),
      createdAt: conversion.createdAt,
    });
  } catch (error) {
    console.error('[GET /api/convert/[id]]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
