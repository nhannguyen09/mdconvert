// lib/constants.ts
// L2: Single source of truth cho magic numbers
// Import file này thay vì hardcode trong code

export const CONVERT = {
  // Gemini image batch processing
  IMAGE_CONCURRENCY:          5,
  IMAGE_CHUNK_DELAY_MS:       300,

  // PDF batch processing
  PDF_CONCURRENT_BATCHES:     3,
  PDF_PAGES_PER_BATCH_DEFAULT: 20,

  // Gemini retry/rate-limit
  GEMINI_RETRY_DELAY_MS:      2_000,
  GEMINI_PAUSE_AFTER_FAILS_MS: 30_000,
  GEMINI_TIMEOUT_MS:          60_000,
  GEMINI_MAX_RETRIES:         3,
  GEMINI_DELAY_BETWEEN_MS:    200,
  GEMINI_CONSECUTIVE_FAIL_THRESHOLD: 3,

  // Client polling
  POLL_INITIAL_INTERVAL_MS:   2_000,
  POLL_STEP_EVERY_N_POLLS:    10,
  POLL_BACKOFF_FACTOR:        1.5,
  POLL_MAX_INTERVAL_MS:       10_000,

  // File lifecycle
  CLEANUP_INTERVAL_HOURS:     6,
  FILE_RETENTION_HOURS:       24,

  // Upload
  MAX_FILE_SIZE_BYTES:        300 * 1024 * 1024, // 300MB
  TINY_IMAGE_THRESHOLD_PX:    10,
} as const;
