// lib/cleanup-scheduler.ts
// Singleton: chạy cleanup 1 lần khi server khởi động + mỗi 6 tiếng
// Import từ layout.tsx để đảm bảo chạy khi app start

import { cleanupExpiredFiles } from './cleanup';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

let scheduled = false;

export function ensureCleanupScheduled(): void {
  if (scheduled) return;
  scheduled = true;

  // Chạy lần đầu sau 10s (đợi server fully ready)
  setTimeout(() => {
    cleanupExpiredFiles().catch(err =>
      console.error('[Cleanup] Initial run failed:', err)
    );
  }, 10_000);

  // Lặp mỗi 6 tiếng
  setInterval(() => {
    cleanupExpiredFiles().catch(err =>
      console.error('[Cleanup] Scheduled run failed:', err)
    );
  }, SIX_HOURS_MS);
}
