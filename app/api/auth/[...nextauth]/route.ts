// app/api/auth/[...nextauth]/route.ts
// NextAuth — authOptions extracted to lib/auth-options.ts for reuse in getServerSession()

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
