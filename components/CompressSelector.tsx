'use client';

// components/CompressSelector.tsx
// Radio group 4 mức compress Ghostscript (chỉ hiện cho PDF)

export type CompressLevel = 'screen' | 'ebook' | 'printer' | 'prepress';

const OPTIONS: { value: CompressLevel; label: string; dpi: string; desc: string }[] = [
  { value: 'screen',   label: 'Screen',   dpi: '72 DPI',  desc: 'Nhẹ nhất, chỉ cần AI đọc' },
  { value: 'ebook',    label: 'Ebook',    dpi: '150 DPI', desc: 'Khuyến nghị' },
  { value: 'printer',  label: 'Printer',  dpi: '300 DPI', desc: 'Chất lượng cao' },
  { value: 'prepress', label: 'Prepress', dpi: '300+ DPI', desc: 'Giữ nguyên gốc' },
];

interface Props {
  value: CompressLevel;
  onChange: (level: CompressLevel) => void;
}

export default function CompressSelector({ value, onChange }: Props) {
  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">Mức nén PDF</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${
                selected
                  ? 'border-[#3CABD2] bg-teal-50'
                  : 'border-gray-200 hover:border-[#3CABD2]/50 bg-white'
              }`}
            >
              <input
                type="radio"
                name="compressLevel"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
              <div className={`text-xs font-medium mt-0.5 ${selected ? 'text-[#3CABD2]' : 'text-gray-500'}`}>
                {opt.dpi}
              </div>
              <div className="text-xs text-gray-400 mt-1 leading-tight">{opt.desc}</div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
