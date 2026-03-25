// middleware.ts
// Redirect to /setup when no users exist (first-run detection).
// By default the app requires no login — anyone with the URL can use it.
// To enable login: set require_login = true in AppSetting (future feature).

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that bypass all middleware checks
const BYPASS_PREFIXES = [
  '/setup',
  '/api/setup',
  '/api/auth',
  '/api/health',
  '/login',
  '/_next',
  '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BYPASS_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check if setup is complete (has at least one user)
  try {
    const statusUrl = new URL('/api/setup', request.url);
    const res = await fetch(statusUrl, { cache: 'no-store' });
    const data = await res.json() as { hasUsers: boolean };

    if (!data.hasUsers) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }
  } catch {
    // If status check fails, don't block access
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico).*)',
  ],
};
