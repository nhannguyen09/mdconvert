// app/api/cleanup/route.ts
// GET /api/cleanup — internal endpoint, trigger manual cleanup
// Gọi bởi cron hoặc monitoring

import { cleanupExpiredFiles } from '@/lib/cleanup';

export async function GET() {
  try {
    const result = await cleanupExpiredFiles();
    return Response.json(result);
  } catch (error) {
    console.error('[GET /api/cleanup]', error);
    return Response.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
