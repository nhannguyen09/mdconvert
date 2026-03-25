'use client';

// components/UploadForm.tsx
// Drag-drop upload nhiều file + compress selector + convert button

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, File, X, Loader2 } from 'lucide-react';
import CompressSelector, { type CompressLevel } from './CompressSelector';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validateFileClient(f: File): string | null {
  const ext = f.name.split('.').pop()?.toLowerCase();
  if (ext !== 'docx' && ext !== 'pdf') return 'Chỉ hỗ trợ .docx và .pdf';
  if (f.size > 300 * 1024 * 1024) return 'File quá lớn (tối đa 300MB)';
  return null;
}

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [compressLevel, setCompressLevel] = useState<CompressLevel>('ebook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPdf = files.some(f => f.name.toLowerCase().endsWith('.pdf'));
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  function acceptFiles(incoming: FileList | File[]) {
    const arr = Array.from(incoming);
    const newFiles: File[] = [];
    const errs: string[] = [];

    for (const f of arr) {
      const err = validateFileClient(f);
      if (err) { errs.push(`${f.name}: ${err}`); continue; }
      if (!files.find(existing => existing.name === f.name)) {
        newFiles.push(f);
      }
    }

    if (errs.length > 0) setError(errs.join('\n'));
    else setError(null);

    if (newFiles.length > 0) setFiles(prev => [...prev, ...newFiles]);
  }

  function removeFile(name: string) {
    setFiles(prev => prev.filter(f => f.name !== name));
    setError(null);
  }

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) acceptFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  async function handleConvert() {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      form.append('compressLevel', compressLevel);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? 'Upload thất bại');
        setLoading(false);
        return;
      }

      const conversionIds: string[] = (uploadData.conversions ?? []).map((c: { id: string }) => c.id);

      if (conversionIds.length === 0) {
        setError('Không có file nào được upload thành công');
        setLoading(false);
        return;
      }

      if (uploadData.errors?.length > 0) {
        const errMsgs = uploadData.errors.map((e: { fileName: string; error: string }) => `${e.fileName}: ${e.error}`);
        setError(errMsgs.join('\n'));
      }

      const convertRes = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversionIds }),
      });

      if (!convertRes.ok) {
        const d = await convertRes.json();
        setError(d.error ?? 'Không thể bắt đầu convert');
        setLoading(false);
        return;
      }

      if (conversionIds.length === 1) {
        router.push(`/convert/${conversionIds[0]}`);
      } else {
        router.push(`/batch?ids=${conversionIds.join(',')}`);
      }
    } catch {
      setError('Lỗi kết nối server. Vui lòng thử lại.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onClick={() => files.length === 0 && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl transition-all ${
          dragging
            ? 'border-[#3CABD2] bg-teal-50'
            : files.length > 0
            ? 'border-[#3CABD2]/40 bg-gray-50'
            : 'border-gray-300 hover:border-[#3CABD2] hover:bg-gray-50 cursor-pointer'
        } ${files.length === 0 ? 'p-10 text-center' : 'p-4'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.pdf"
          multiple
          className="sr-only"
          onChange={e => e.target.files && acceptFiles(e.target.files)}
        />

        {files.length === 0 ? (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Kéo thả file .docx hoặc .pdf vào đây</p>
            <p className="text-sm text-gray-400 mt-1">hoặc click để chọn • hỗ trợ nhiều file • tối đa 100MB/file</p>
          </>
        ) : (
          <div className="space-y-2">
            {files.map(f => {
              const isPdf = f.name.toLowerCase().endsWith('.pdf');
              return (
                <div key={f.name} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-3 py-2.5 shadow-sm">
                  <div className="shrink-0">
                    {isPdf
                      ? <File className="w-5 h-5 text-[#3CABD2]" />
                      : <FileText className="w-5 h-5 text-[#1A428A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{formatBytes(f.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                    className="shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full py-2 text-sm text-[#3CABD2] hover:text-[#2a9bbf] border border-dashed border-[#3CABD2]/40 rounded-lg hover:border-[#3CABD2] transition-colors"
            >
              + Thêm file
            </button>

            <p className="text-xs text-gray-400 text-right pt-1">
              {files.length} file • tổng {formatBytes(totalSize)}
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && hasPdf && (
        <CompressSelector value={compressLevel} onChange={setCompressLevel} />
      )}

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 whitespace-pre-line">
          {error}
        </div>
      )}

      <button
        onClick={handleConvert}
        disabled={files.length === 0 || loading}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#1A428A] text-white font-semibold rounded-lg hover:bg-[#153570] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang upload...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            {files.length > 1 ? `Convert ${files.length} file` : 'Convert'}
          </>
        )}
      </button>
    </div>
  );
}
