// app/settings/page.tsx
// Trang cài đặt AI provider

import SettingsForm from '@/components/SettingsForm';

export default function SettingsPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A428A]">Cài đặt AI</h1>
        <p className="text-gray-500 text-sm mt-1">
          Cấu hình API key và model AI dùng để mô tả hình ảnh và convert PDF.
        </p>
      </div>
      <SettingsForm />
    </main>
  );
}
