// lib/auth-helpers.ts
// C2: Ownership check helper — đảm bảo user chỉ access được conversion của chính mình

import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { prisma } from './prisma';
import type { Conversion } from '@prisma/client';

// Lấy user ID từ session, fallback 'system' nếu chưa login
export async function getSessionUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return 'system';
  const userWithId = session.user as typeof session.user & { id?: string };
  return userWithId.id || session.user.email || 'system';
}

// Tìm conversion + verify ownership. Throw 'NOT_FOUND' nếu không tồn tại hoặc không thuộc về user.
export async function getConversionWithOwnerCheck(
  id: string,
  userId: string
): Promise<Conversion & { imageDescriptions?: unknown[] }> {
  const conversion = await prisma.conversion.findFirst({
    where: {
      id,
      createdBy: userId,
      deletedAt: null,
    },
    include: { imageDescriptions: true },
  });

  if (!conversion) {
    throw new Error('NOT_FOUND');
  }

  return conversion;
}
