// app/api/cleanup/route.ts
// GET /api/cleanup — internal endpoint, trigger manual cleanup
// Gọi bởi cron hoặc monitoring
// Auth: yêu cầu x-cleanup-secret khớp với NEXTAUTH_SECRET (không trust Host header)

import { cleanupExpiredFiles } from '@/lib/cleanup';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cleanup-secret');
    const expectedSecret = process.env.NEXTAUTH_SECRET;

    if (!expectedSecret || authHeader !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cleanupExpiredFiles();
    return Response.json(result);
  } catch (error) {
    console.error('[GET /api/cleanup]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
