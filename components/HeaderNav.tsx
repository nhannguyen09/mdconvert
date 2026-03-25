'use client';
// components/HeaderNav.tsx — ẩn trên trang /login

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Clock, Settings } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default function HeaderNav() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/setup') return null;

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <nav className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold font-heading text-[#1A428A]">Convert to Markdown</span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-[#1A428A] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Trang chủ
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-[#1A428A] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            Lịch sử
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-[#1A428A] hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Cài đặt
          </Link>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <LogoutButton />
        </div>
      </nav>
    </header>
  );
}
