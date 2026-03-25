'use client';

// app/batch/page.tsx
// Trang batch result: poll nhiều conversions, hiển thị progress

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Eye, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, FileText, File, Package } from 'lucide-react';
import StatusBadge, { type ConversionStatus } from '@/components/StatusBadge';

interface ConversionItem {
  id: string;
  fileName: string;
  fileType: string;
  status: ConversionStatus;
  progressText: string | null;
  errorMessage: string | null;
  imageCount: number;
  filesDeleted: boolean;
  startedAt: number; // timestamp khi bắt đầu poll
  finishedAt: number | null;
}

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

function estimateRemaining(items: ConversionItem[]): string | null {
  const done = items.filter(i => i.status === 'completed' || i.status === 'failed');
  const pending = items.filter(i => i.status !== 'completed' && i.status !== 'failed');
  if (done.length === 0 || pending.length === 0) return null;

  const durations = done
    .filter(i => i.finishedAt !== null)
    .map(i => i.finishedAt! - i.startedAt);

  if (durations.length === 0) return null;
  const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
  const estimateMs = avgMs * pending.length;
  const mins = Math.ceil(estimateMs / 60000);
  return mins <= 1 ? '~1 phút' : `~${mins} phút`;
}

function BatchPageInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') ?? '';
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : [];

  const [items, setItems] = useState<ConversionItem[]>(() =>
    ids.map(id => ({
      id,
      fileName: id,
      fileType: 'docx',
      status: 'pending' as ConversionStatus,
      progressText: null,
      errorMessage: null,
      imageCount: 0,
      filesDeleted: false,
      startedAt: Date.now(),
      finishedAt: null,
    }))
  );

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      ids.map(id => fetch(`/api/convert/${id}`).then(r => r.json()))
    );

    setItems(prev =>
      prev.map((item, i) => {
        const r = results[i];
        if (r.status !== 'fulfilled') return item;
        const data = r.value;
        const isDone = data.status === 'completed' || data.status === 'failed';
        return {
          ...item,
          fileName: data.fileName ?? item.fileName,
          fileType: data.fileType ?? item.fileType,
          status: data.status ?? item.status,
          progressText: data.progressText ?? null,
          errorMessage: data.errorMessage ?? null,
          imageCount: data.imageCount ?? 0,
          filesDeleted: data.filesDeleted ?? false,
          finishedAt: isDone && item.finishedAt === null ? Date.now() : item.finishedAt,
        };
      })
    );
  }, [ids]);

  // Initial fetch + polling
  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      setItems(prev => {
        const allDone = prev.every(i => i.status === 'completed' || i.status === 'failed');
        if (allDone) { clearInterval(interval); return prev; }
        return prev;
      });
      fetchAll();
    }, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ids.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Không có conversion nào.</p>
        <Link href="/" className="mt-4 inline-block text-[#3CABD2] hover:underline">← Về trang chủ</Link>
      </div>
    );
  }

  const completed = items.filter(i => i.status === 'completed');
  const failed = items.filter(i => i.status === 'failed');
  const inProgress = items.filter(i => i.status !== 'completed' && i.status !== 'failed');
  const allDone = inProgress.length === 0;
  const progress = Math.round((completed.length + failed.length) / items.length * 100);
  const estimate = estimateRemaining(items);

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-heading text-[#1A428A]">
          Batch Convert ({items.length} file)
        </h1>
        {!allDone && (
          <button onClick={fetchAll} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">
            {completed.length + failed.length}/{items.length} file hoàn tất
          </span>
          <span className="text-gray-400">
            {allDone ? 'Xong!' : estimate ? `Ước tính: ${estimate} còn lại` : 'Đang xử lý...'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full transition-all duration-500 bg-[#1A428A]"
            style={{ width: `${progress}%` }}
          />
        </div>
        {failed.length > 0 && (
          <p className="text-xs text-red-500">{failed.length} file lỗi</p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên file</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Chi tiết</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 max-w-[220px]">
                  <div className="flex items-center gap-2">
                    {item.fileType === 'pdf'
                      ? <File className="w-4 h-4 text-[#3CABD2] shrink-0" />
                      : <FileText className="w-4 h-4 text-[#1A428A] shrink-0" />}
                    <span className="truncate text-gray-900 font-medium" title={item.fileName}>
                      {item.fileName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="uppercase text-xs font-medium text-gray-500">{item.fileType}</span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">
                  {item.status === 'completed' && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.imageCount > 0 ? `${item.imageCount} hình` : 'Hoàn tất'}
                      {item.finishedAt && ` · ${formatDuration(item.finishedAt - item.startedAt)}`}
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />
                      {item.errorMessage?.slice(0, 60) ?? 'Lỗi'}
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Chờ
                    </span>
                  )}
                  {(item.status === 'compressing' || item.status === 'processing') && (
                    <span className="text-[#3CABD2] flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {item.progressText ?? 'Đang xử lý...'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {item.status === 'completed' && !item.filesDeleted && (
                      <>
                        <Link
                          href={`/convert/${item.id}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#1A428A] border border-gray-200 hover:border-[#1A428A] rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem
                        </Link>
                        <a
                          href={`/api/convert/${item.id}/download`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:text-[#3CABD2] border border-gray-200 hover:border-[#3CABD2] rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Tải
                        </a>
                      </>
                    )}
                    {item.status === 'failed' && (
                      <Link
                        href="/"
                        className="px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Thử lại
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Batch download when all done */}
      {allDone && completed.length > 0 && (
        <div className="sticky bottom-4 flex justify-center">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-4 flex flex-col items-center gap-2">
            <form
              action="/api/download/batch"
              method="POST"
              onSubmit={async e => {
                e.preventDefault();
                const res = await fetch('/api/download/batch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conversionIds: completed.map(c => c.id) }),
                });
                if (res.ok) {
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                  a.download = `batch-${today}.zip`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-[#1A428A] text-white rounded-xl font-semibold hover:bg-[#153570] transition-colors text-base"
              >
                <Package className="w-5 h-5" />
                Tải tất cả ({completed.length} file) — 1 ZIP
              </button>
            </form>
            <p className="text-xs text-gray-400">
              ZIP chứa: {completed.length} thư mục
              {failed.length > 0 && ` · ${failed.length} file lỗi không được đưa vào`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatchPage() {
  return (
    <Suspense fallback={
      <div className="py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3CABD2]" />
      </div>
    }>
      <BatchPageInner />
    </Suspense>
  );
}
