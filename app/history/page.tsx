// app/history/page.tsx
// Trang lịch sử conversion

import ConversionHistory from '@/components/ConversionHistory';

export default function HistoryPage() {
  return (
    <main className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#1A428A]">Lịch sử</h1>
        <p className="text-gray-500 mt-1 text-sm">Tất cả conversions đã thực hiện</p>
      </div>
      <ConversionHistory />
    </main>
  );
}
