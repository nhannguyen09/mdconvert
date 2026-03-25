// app/api/convert/[id]/edit/route.ts
// PUT /api/convert/[id]/edit — ghi đè nội dung markdown đã sửa

import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const conversion = await prisma.conversion.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!conversion) {
      return Response.json({ error: 'Conversion không tồn tại' }, { status: 404 });
    }

    if (conversion.status !== 'completed') {
      return Response.json(
        { error: 'Chỉ có thể chỉnh sửa conversion đã hoàn tất' },
        { status: 400 }
      );
    }

    const body = await request.json() as { fullMd?: string; textOnlyMd: string };

    // Ghi đè text-only.md
    if (conversion.textOnlyMdPath && body.textOnlyMd !== undefined) {
      await fs.writeFile(conversion.textOnlyMdPath, body.textOnlyMd, 'utf-8');
    }

    // Ghi đè full.md (chỉ DOCX)
    if (conversion.fullMdPath && body.fullMd !== undefined) {
      await fs.writeFile(conversion.fullMdPath, body.fullMd, 'utf-8');
    }

    // Touch updatedAt
    await prisma.conversion.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[PUT /api/convert/[id]/edit]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
