'use client';

// components/ConversionHistory.tsx
// Bảng lịch sử conversion với pagination + soft delete

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Eye, Download, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import StatusBadge, { type ConversionStatus } from '@/components/StatusBadge';

interface HistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  compressedSize: number | null;
  imageCount: number;
  status: ConversionStatus;
  filesDeleted: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: HistoryItem[];
  total: number;
  page: number;
  limit: number;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ConversionHistory() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?page=${p}&limit=10`);
      if (res.ok) {
        const json: PaginatedResponse = await res.json();
        setData(json);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  async function handleDelete(id: string, fileName: string) {
    if (!confirm(`Xóa "${fileName}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchPage(page);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3CABD2]" />
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        Chưa có conversion nào.{' '}
        <Link href="/" className="text-[#3CABD2] hover:underline">
          Upload file để bắt đầu.
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC] border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tên file</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Loại</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Dung lượng</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Sau nén</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Số hình</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Ngày</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="truncate block text-gray-900" title={item.fileName}>
                    {item.fileName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="uppercase text-xs font-medium text-gray-500">{item.fileType}</span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{formatBytes(item.fileSize)}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.compressedSize ? formatBytes(item.compressedSize) : '—'}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {item.imageCount > 0 ? item.imageCount : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {item.filesDeleted && (
                    <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                      Đã xóa sau 24h
                    </span>
                  )}
                  <div className="flex items-center justify-end gap-1">
                    {item.filesDeleted ? (
                      <span className="p-1.5 text-gray-300 cursor-not-allowed" title="File đã xóa sau 24h">
                        <Eye className="w-4 h-4" />
                      </span>
                    ) : (
                      <Link
                        href={`/convert/${item.id}`}
                        className="p-1.5 text-gray-500 hover:text-[#1A428A] hover:bg-blue-50 rounded-lg transition-colors"
                        title="Xem"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    {item.status === 'completed' && !item.filesDeleted && (
                      <a
                        href={`/api/convert/${item.id}/download`}
                        className="p-1.5 text-gray-500 hover:text-[#3CABD2] hover:bg-teal-50 rounded-lg transition-colors"
                        title="Tải ZIP"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, item.fileName)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      title="Xóa"
                    >
                      {deletingId === item.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(() => {
        const totalPages = Math.ceil(data.total / data.limit);
        if (totalPages <= 1) return null;
        return (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Trang {data.page} / {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchPage(page - 1)}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              onClick={() => fetchPage(page + 1)}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
