'use client';

// components/SettingsForm.tsx
// Form for AI provider settings: provider, api key, model, prompts

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Zap, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';

// ─── Prompt presets (mirrors lib/settings.ts — kept client-side for instant fill) ──
const PROMPT_PRESETS = {
  en: {
    image: `You are describing an image from an internal SOP (Standard Operating Procedure) document. Purpose: to help AI agents guide employees through procedures without seeing the original image.

Describe in detail using this structure:

1. IMAGE TYPE: Screenshot of software, process diagram, real photo, or table/chart.

2. MAIN CONTENT:
   - If software screenshot: app name, current screen, data fields, sample values, highlighted buttons or arrows.
   - If process diagram: list each step in order with arrow directions.
   - If real photo: describe objects, positions, conditions.
   - If table/chart: list column headers and sample rows.

3. TEXT IN IMAGE: Transcribe ALL visible text exactly as shown, especially labels, titles, values, button names.

4. ACTION REQUIRED: If the image illustrates a specific action, describe exactly what to click/type/select and where.

Do not add personal opinions. Do not guess information not visible in the image.`,
    pdf: `Convert this document to Markdown. Preserve heading structure, tables, and lists.

For each image in the document, replace with a detailed description block:
> **[Image]:** [detailed description]

Include: image type, software name if screenshot, all visible text, and required actions if applicable.

Output clean Markdown with proper heading hierarchy (h1, h2, h3).`,
  },
  vi: {
    image: `Bạn là trợ lý mô tả hình ảnh cho tài liệu SOP (quy trình nội bộ). Mô tả chi tiết hình ảnh này bằng tiếng Việt theo cấu trúc sau:\n\n1. Một câu tóm tắt ngắn về nội dung tổng thể của hình.\n2. Mô tả chi tiết các thành phần chính: tên màn hình/giao diện, các nút bấm, menu, bảng dữ liệu, trường nhập liệu.\n3. Ghi rõ tất cả text/số liệu hiển thị trong hình (tên cột, giá trị, nhãn nút).\n4. Mô tả trạng thái hiện tại và thao tác mà người dùng đang thực hiện hoặc cần thực hiện.\n\nNếu hình trắng hoặc không có nội dung rõ ràng, chỉ ghi: "[Hình không có nội dung]".`,
    pdf: `Convert tài liệu này sang Markdown tiếng Việt. Giữ nguyên cấu trúc heading, bảng, danh sách. Mô tả chi tiết mọi hình ảnh trong tài liệu, bao gồm text trong hình nếu có.`,
  },
} as const;

interface Settings {
  ai_provider: string;
  ai_api_key: string;
  ai_model: string;
  ai_image_prompt: string;
  ai_pdf_prompt: string;
  pdf_pages_per_batch: string;
  pdf_max_pages: string;
}

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI (sắp hỗ trợ)' },
  { value: 'anthropic', label: 'Anthropic Claude (sắp hỗ trợ)' },
];

const MODEL_SUGGESTIONS: Record<string, { id: string; label: string }[]> = {
  gemini: [
    // Gemini 2.5
    { id: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
    // Gemini 2.0
    { id: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite' },
    // Gemini 1.5
    { id: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash',      label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-flash-8b',   label: 'Gemini 1.5 Flash-8B' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4o',      label: 'GPT-4o' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  ],
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({
    ai_provider: 'gemini',
    ai_api_key: '',
    ai_model: 'gemini-2.0-flash-lite',
    ai_image_prompt: '',
    ai_pdf_prompt: '',
    pdf_pages_per_batch: '20',
    pdf_max_pages: '0',
  });
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((data: Settings) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveResult({ ok: true, msg: 'Lưu settings thành công!' });
      } else {
        const data = await res.json();
        setSaveResult({ ok: false, msg: data.error || 'Lỗi khi lưu settings' });
      }
    } catch {
      setSaveResult({ ok: false, msg: 'Lỗi kết nối server' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    // Lưu trước rồi mới test
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const res = await fetch('/api/settings/test', { method: 'POST' });
      const data = await res.json();
      setTestResult({ ok: data.success, msg: data.message });
    } catch {
      setTestResult({ ok: false, msg: 'Lỗi kết nối server' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#3CABD2]" />
        <span className="ml-2 text-gray-500">Đang tải settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* AI Provider */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">AI Provider</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Provider
          </label>
          <select
            value={settings.ai_provider}
            onChange={e => setSettings(s => ({ ...s, ai_provider: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent"
          >
            {PROVIDER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* X4: Warning khi chọn provider không hỗ trợ PDF */}
        {settings.ai_provider !== 'gemini' && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              Provider này hiện chỉ hỗ trợ mô tả hình ảnh (DOCX). Convert PDF yêu cầu Gemini.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.ai_api_key}
              onChange={e => setSettings(s => ({ ...s, ai_api_key: e.target.value }))}
              placeholder="Nhập API key..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            API key được mã hóa AES-256 trước khi lưu vào database.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Model
          </label>
          <input
            type="text"
            value={settings.ai_model}
            onChange={e => setSettings(s => ({ ...s, ai_model: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {(MODEL_SUGGESTIONS[settings.ai_provider] ?? []).map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSettings(s => ({ ...s, ai_model: m.id }))}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  settings.ai_model === m.id
                    ? 'bg-[#3CABD2] text-white border-[#3CABD2]'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#3CABD2]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prompts */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Prompts</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Preset language:</span>
            <select
              onChange={e => {
                const lang = e.target.value as 'en' | 'vi';
                setSettings(s => ({
                  ...s,
                  ai_image_prompt: PROMPT_PRESETS[lang].image,
                  ai_pdf_prompt:   PROMPT_PRESETS[lang].pdf,
                }));
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#3CABD2]"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Image description prompt (DOCX)
          </label>
          <textarea
            rows={3}
            value={settings.ai_image_prompt}
            onChange={e => setSettings(s => ({ ...s, ai_image_prompt: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            PDF conversion prompt
          </label>
          <textarea
            rows={3}
            value={settings.ai_pdf_prompt}
            onChange={e => setSettings(s => ({ ...s, ai_pdf_prompt: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent resize-y"
          />
        </div>
      </div>

      {/* X1: PDF Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">PDF Settings</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số trang mỗi batch
            </label>
            <input
              type="number"
              min="5"
              max="50"
              value={settings.pdf_pages_per_batch}
              onChange={e => setSettings(s => ({ ...s, pdf_pages_per_batch: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Giới hạn trang tối đa
            </label>
            <input
              type="number"
              min="0"
              value={settings.pdf_max_pages}
              onChange={e => setSettings(s => ({ ...s, pdf_max_pages: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3CABD2] focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Đặt giới hạn = <strong>0</strong> để xử lý toàn bộ file PDF. File 200+ trang có thể mất 10–15 phút.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A428A] text-white rounded-lg text-sm font-medium hover:bg-[#153570] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>

        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#3CABD2] text-[#3CABD2] rounded-lg text-sm font-medium hover:bg-teal-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {testing ? 'Đang kiểm tra...' : 'Test Connection'}
        </button>
      </div>

      {/* Results */}
      {saveResult && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
          saveResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {saveResult.ok
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {saveResult.msg}
        </div>
      )}

      {testResult && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
          testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {testResult.ok
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {testResult.msg}
        </div>
      )}
    </div>
  );
}
