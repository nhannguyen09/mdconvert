'use client';

// app/convert/[id]/page.tsx
// Trang kết quả: polling status → preview/edit/download

import { useEffect, useState, useCallback, useRef } from 'react';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, Pencil, Eye, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import StatusBadge, { type ConversionStatus } from '@/components/StatusBadge';
import MarkdownPreview from '@/components/MarkdownPreview';
import MarkdownEditor from '@/components/MarkdownEditor';

interface ConversionData {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  compressedSize: number | null;
  compressLevel: string | null;
  status: ConversionStatus;
  progressText: string | null;
  filesDeleted: boolean;
  errorMessage: string | null;
  imageCount: number;
  fullMd: string | null;
  textOnlyMd: string | null;
  createdAt: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

const STATUS_MESSAGES: Record<string, string> = {
  pending:     'Chờ xử lý...',
  compressing: 'Đang nén file và trích xuất hình...',
  processing:  'Đang mô tả hình ảnh với AI...',
};

export default function ConvertResultPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ConversionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'full' | 'text-only'>('full');
  const [editMode, setEditMode] = useState(false);

  // M2: Exponential backoff polling — tăng interval sau mỗi 10 lần, tối đa 10s
  const [pollInterval, setPollInterval] = useState(2000);
  const pollCountRef = useRef(0);
  const prevStatusRef = useRef<string | null>(null);

  const fetchData = useCallback(async (lite = false) => {
    try {
      const url = lite ? `/api/convert/${id}?lite=true` : `/api/convert/${id}`;
      const res = await fetch(url);
      if (!res.ok) { setError('Không tìm thấy conversion'); return; }
      const json: ConversionData = await res.json();
      setData(json);
    } catch {
      setError('Lỗi kết nối server');
    }
  }, [id]);

  // Fetch đầy đủ lần đầu
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Polling với backoff — dừng khi completed/failed
  useEffect(() => {
    if (data?.status === 'completed' || data?.status === 'failed') return;

    const timer = setTimeout(async () => {
      pollCountRef.current += 1;
      // Tăng interval sau mỗi 10 lần poll
      if (pollCountRef.current % 10 === 0) {
        setPollInterval(prev => Math.min(Math.floor(prev * 1.5), 10_000));
      }
      await fetchData(true); // lite mode khi polling
    }, pollInterval);

    return () => clearTimeout(timer);
  }, [data, fetchData, pollInterval]);

  // Khi status → completed: fetch lại đầy đủ để lấy markdown content
  useEffect(() => {
    if (data?.status === 'completed' && prevStatusRef.current !== 'completed') {
      fetchData(false);
    }
    prevStatusRef.current = data?.status ?? null;
  }, [data?.status, fetchData]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-[#3CABD2] hover:underline">← Về trang chủ</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3CABD2]" />
      </div>
    );
  }

  const isDocx = data.fileType === 'docx';
  const activeContent = activeTab === 'full' ? data.fullMd : data.textOnlyMd;

  // ─── Processing state ──────────────────────────────────────────────────────
  if (data.status !== 'completed' && data.status !== 'failed') {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#3CABD2]" />
          <div className="text-left">
            <StatusBadge status={data.status} />
            <p className="text-sm text-gray-600 mt-1">
              {data.progressText ?? STATUS_MESSAGES[data.status] ?? 'Đang xử lý...'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">Trang này tự cập nhật mỗi 2 giây</p>
      </div>
    );
  }

  // ─── Failed state ──────────────────────────────────────────────────────────
  if (data.status === 'failed') {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <StatusBadge status="failed" className="mb-3" />
          <h2 className="font-semibold text-gray-900 mb-2">{data.fileName}</h2>
          <p className="text-sm text-red-700 font-mono bg-red-100 rounded p-3 mt-2">
            {data.errorMessage ?? 'Lỗi không xác định'}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 text-sm text-[#1A428A] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Upload lại
          </Link>
        </div>
      </div>
    );
  }

  // ─── Files deleted ─────────────────────────────────────────────────────────
  if (data.filesDeleted) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-2">{data.fileName}</h2>
          <p className="text-sm text-amber-700">
            File đã được xóa tự động sau 24h. Vui lòng convert lại nếu cần.
          </p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 text-sm text-[#1A428A] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Upload lại
          </Link>
        </div>
      </div>
    );
  }

  // ─── Completed ─────────────────────────────────────────────────────────────
  const zipUrl = `/api/convert/${id}/download`;

  return (
    <div className="py-8 space-y-6">
      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">{data.fileName}</h1>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap gap-3 text-sm text-gray-500 bg-[#F8FAFC] rounded-lg px-4 py-3 border border-gray-100">
        <span className="font-medium text-gray-700 uppercase text-xs">{data.fileType}</span>
        <span>•</span>
        <span>Gốc: {formatBytes(data.fileSize)}</span>
        {data.compressedSize && (
          <>
            <span>→</span>
            <span>Nén: {formatBytes(data.compressedSize)}</span>
          </>
        )}
        {data.imageCount > 0 && (
          <>
            <span>•</span>
            <span>{data.imageCount} hình</span>
          </>
        )}
      </div>

      {/* Tab switcher (DOCX only) */}
      {isDocx && !editMode && (
        <div className="flex gap-2 border-b border-gray-200">
          {(['full', 'text-only'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#1A428A] text-[#1A428A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'full' ? 'Full (có hình)' : 'Text-only'}
            </button>
          ))}
        </div>
      )}

      {/* Edit/Preview toggle bar */}
      {!editMode && (
        <div className="flex justify-end">
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </div>
      )}

      {/* Content */}
      {editMode ? (
        <MarkdownEditor
          conversionId={id}
          initialFullMd={data.fullMd}
          initialTextOnlyMd={data.textOnlyMd ?? ''}
          activeTab={activeTab}
          onSave={(fMd, tMd) => {
            setData(prev => prev ? { ...prev, fullMd: fMd, textOnlyMd: tMd } : prev);
            setEditMode(false);
          }}
          onCancel={() => setEditMode(false)}
        />
      ) : (
        <MarkdownPreview content={activeContent ?? ''} />
      )}

      {/* Download sticky bar */}
      <div className="sticky bottom-4 flex justify-center">
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-6 py-3 flex items-center gap-4">
          <div className="text-xs text-gray-500">
            {isDocx ? 'ZIP: full.md + text-only.md + hình gốc' : 'ZIP: text-only.md'}
          </div>
          <a
            href={zipUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A428A] text-white rounded-lg text-sm font-semibold hover:bg-[#153570] transition-colors"
          >
            <Download className="w-4 h-4" />
            Tải ZIP
          </a>
        </div>
      </div>
    </div>
  );
}
