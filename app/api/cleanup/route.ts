// app/api/cleanup/route.ts
// GET /api/cleanup — internal endpoint, trigger manual cleanup
// Gọi bởi cron hoặc monitoring
// H5: auth check — chỉ cho localhost hoặc request có đúng secret key

import { cleanupExpiredFiles } from '@/lib/cleanup';

export async function GET(request: Request) {
  try {
    // H5: Chỉ cho phép từ localhost hoặc với NEXTAUTH_SECRET header
    const host = request.headers.get('host') ?? '';
    const authHeader = request.headers.get('x-cleanup-secret');
    const expectedSecret = process.env.NEXTAUTH_SECRET;

    const isLocalhost =
      host.startsWith('localhost') ||
      host.startsWith('127.0.0.1') ||
      host.startsWith('::1');

    if (!isLocalhost && authHeader !== expectedSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cleanupExpiredFiles();
    return Response.json(result);
  } catch (error) {
    console.error('[GET /api/cleanup]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
