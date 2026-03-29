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

  try {
    // H2: Dùng transaction để count + create atomic — chặn TOCTOU race
    await prisma.$transaction(async (tx) => {
      const count = await tx.user.count();
      if (count > 0) throw new Error('ALREADY_SETUP');
      await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name: email.split('@')[0],
          password: hash,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_SETUP') {
      return NextResponse.json({ error: 'Setup already complete' }, { status: 403 });
    }
    throw err;
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
