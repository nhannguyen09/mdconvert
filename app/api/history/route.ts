// app/api/history/route.ts
// GET /api/history?page=1&limit=20 — danh sách conversions (soft delete aware)

import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.conversion.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          compressedSize: true,
          compressLevel: true,
          imageCount: true,
          status: true,
          errorMessage: true,
          filesDeleted: true,
          createdAt: true,
        },
      }),
      prisma.conversion.count({ where: { deletedAt: null } }),
    ]);

    return Response.json({ data, total, page, limit });
  } catch (error) {
    console.error('[GET /api/history]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// DELETE /api/history?id=xxx — soft delete
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Thiếu id' }, { status: 400 });
    }

    await prisma.conversion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/history]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
