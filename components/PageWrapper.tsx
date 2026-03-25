'use client';
// components/PageWrapper.tsx — full width on /login, max-width container otherwise

import { usePathname } from 'next/navigation';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') {
    return <>{children}</>;
  }
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      {children}
    </div>
  );
}
