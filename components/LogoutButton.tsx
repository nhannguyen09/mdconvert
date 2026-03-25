'use client';
// components/LogoutButton.tsx

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Đăng xuất"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Đăng xuất</span>
    </button>
  );
}
