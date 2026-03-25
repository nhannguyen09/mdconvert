// app/api/health/route.ts
// GET /api/health — health check endpoint

export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
