'use client';

// components/MarkdownEditor.tsx
// Textarea chỉnh sửa markdown + nút Lưu / Hủy

import { useState } from 'react';
import { Save, X, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  conversionId: string;
  initialFullMd: string | null;
  initialTextOnlyMd: string;
  activeTab: 'full' | 'text-only';
  onSave: (fullMd: string | null, textOnlyMd: string) => void;
  onCancel: () => void;
}

export default function MarkdownEditor({
  conversionId,
  initialFullMd,
  initialTextOnlyMd,
  activeTab,
  onSave,
  onCancel,
}: Props) {
  const [fullMd, setFullMd] = useState(initialFullMd ?? '');
  const [textOnlyMd, setTextOnlyMd] = useState(initialTextOnlyMd);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentContent = activeTab === 'full' ? fullMd : textOnlyMd;
  const setCurrentContent = activeTab === 'full'
    ? (v: string) => setFullMd(v)
    : (v: string) => setTextOnlyMd(v);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/convert/${conversionId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullMd: initialFullMd !== null ? fullMd : undefined,
          textOnlyMd,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSave(initialFullMd !== null ? fullMd : null, textOnlyMd);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={currentContent}
        onChange={e => setCurrentContent(e.target.value)}
        className="w-full h-[500px] font-mono text-sm border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent resize-y bg-white text-gray-800"
        spellCheck={false}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A428A] text-white rounded-lg text-sm font-medium hover:bg-[#153570] disabled:opacity-60 transition-colors"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved
            ? <CheckCircle className="w-4 h-4" />
            : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Hủy
        </button>
      </div>
    </div>
  );
}
