// app/api/setup/route.ts
// GET  → { hasUsers: boolean }  — used by middleware to detect first-run
// POST → create first admin user (blocked once a user exists)

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const count = await prisma.user.count();
  return NextResponse.json({ hasUsers: count > 0 });
}

export async function POST(req: NextRequest) {
  const count = await prisma.user.count();
  if (count > 0) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password, confirmPassword } = body as {
    email?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: email.split('@')[0],
      password: hash,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
