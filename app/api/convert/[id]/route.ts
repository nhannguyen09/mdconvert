// app/api/convert/[id]/route.ts
// GET /api/convert/[id] — lấy kết quả conversion theo format api-contracts.md

import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const conversion = await prisma.conversion.findUnique({
      where: { id: params.id, deletedAt: null },
      include: { imageDescriptions: true },
    });

    if (!conversion) {
      return Response.json({ error: 'Conversion không tồn tại' }, { status: 404 });
    }

    let fullMd: string | null = null;
    let textOnlyMd: string | null = null;

    if (conversion.status === 'completed') {
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
      images: conversion.imageDescriptions.map(img => ({
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
