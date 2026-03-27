// lib/settings.ts
// Read/write AppSetting from DB. Used by AI wrapper and Settings API.
// M3: PROMPT_PRESETS imported from lib/prompt-presets.ts (single source of truth)

import { prisma } from './prisma';
import { encrypt, decrypt } from './crypto';
import { PROMPT_PRESETS } from './prompt-presets';

export { PROMPT_PRESETS };

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const SETTING_DEFAULTS: Record<string, string> = {
  ai_provider: 'gemini',
  ai_api_key: '',
  ai_model: 'gemini-2.0-flash-lite',
  ai_image_prompt: PROMPT_PRESETS.en.image,
  ai_pdf_prompt:   PROMPT_PRESETS.en.pdf,
  pdf_pages_per_batch: '20',
  pdf_max_pages: '0', // 0 = no limit, process all pages
};

const ENCRYPTED_KEYS = new Set(['ai_api_key']);

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return SETTING_DEFAULTS[key] ?? '';

  if (ENCRYPTED_KEYS.has(key) && row.value) {
    try {
      return decrypt(row.value);
    } catch {
      return '';
    }
  }
  return row.value;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany();
  const result: Record<string, string> = { ...SETTING_DEFAULTS };

  for (const row of rows) {
    if (ENCRYPTED_KEYS.has(row.key) && row.value) {
      try {
        result[row.key] = decrypt(row.value);
      } catch {
        result[row.key] = '';
      }
    } else {
      result[row.key] = row.value;
    }
  }
  return result;
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function setSetting(key: string, value: string): Promise<void> {
  const stored = ENCRYPTED_KEYS.has(key) && value ? encrypt(value) : value;
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: stored },
    create: { key, value: stored },
  });
}

export async function setSettings(updates: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(updates).map(([key, value]) => setSetting(key, value))
  );
}
