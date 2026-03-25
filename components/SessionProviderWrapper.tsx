'use client';
// components/SessionProviderWrapper.tsx
// Wrap app với NextAuth SessionProvider

import { SessionProvider } from 'next-auth/react';

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
