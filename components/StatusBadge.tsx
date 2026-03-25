// components/StatusBadge.tsx

export type ConversionStatus = 'pending' | 'compressing' | 'processing' | 'completed' | 'failed';

const STATUS_CONFIG: Record<ConversionStatus, { label: string; cls: string }> = {
  pending:     { label: 'Chờ xử lý',            cls: 'bg-gray-100 text-gray-600' },
  compressing: { label: 'Đang nén',              cls: 'bg-blue-100 text-blue-700' },
  processing:  { label: 'Đang convert',          cls: 'bg-teal-100 text-[#3CABD2]' },
  completed:   { label: 'Hoàn tất',             cls: 'bg-green-100 text-green-700' },
  failed:      { label: 'Lỗi',                  cls: 'bg-red-100 text-red-700' },
};

interface Props {
  status: ConversionStatus;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls} ${className}`}>
      {cfg.label}
    </span>
  );
}
