// app/api/auth/[...nextauth]/route.ts
// NextAuth — CredentialsProvider backed by DB (bcrypt password hash)

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name ?? undefined, email: user.email ?? undefined };
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 days
  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as typeof session.user & { id: string }).id = token.id as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
