// lib/ai/gemini.ts
// Gemini AI wrapper: vision cho hình ảnh (DOCX flow) + PDF → markdown
// Interface AIVisionProvider đặt sẵn để sau thêm OpenAI/Anthropic

import fs from 'fs/promises';
import { getSetting } from '@/lib/settings';

// ─── Provider interface (extensible) ─────────────────────────────────────────

export interface AIVisionProvider {
  describeImage(imagePath: string, prompt: string): Promise<{ description: string; shortAlt: string }>;
  convertPdf(pdfPath: string, prompt: string): Promise<string>; // trả markdown
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 60_000;
const DELAY_MS = 200;
const RATE_LIMIT_DELAY_MS = 2_000;
const RATE_LIMIT_PAUSE_MS = 30_000;
const MAX_RETRIES = 3;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getApiKey(): Promise<string> {
  // DB trước → .env fallback
  const dbKey = await getSetting('ai_api_key');
  if (dbKey) return dbKey;

  const envKey = process.env.GEMINI_API_KEY;
  if (envKey) return envKey;

  throw new Error('Chưa cấu hình API key. Vào /settings để nhập.');
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('[Timeout]')), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer!);
    return result;
  } catch (e) {
    clearTimeout(timer!);
    throw e;
  }
}

// ─── Gemini implementation ────────────────────────────────────────────────────

class GeminiProvider implements AIVisionProvider {
  async describeImage(
    imagePath: string,
    prompt: string
  ): Promise<{ description: string; shortAlt: string }> {
    const apiKey = await getApiKey();
    const model = await getSetting('ai_model');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-lite' });

    const imageBuffer = await fs.readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    let consecutiveFails = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await withTimeout(
          geminiModel.generateContent([
            { inlineData: { data: base64, mimeType } },
            prompt,
          ]),
          TIMEOUT_MS
        );

        const text = result.response.text().trim();
        const lines = text.split('\n').filter(l => l.trim());
        const shortAlt = lines[0]?.slice(0, 100) ?? 'Hình minh họa';

        await sleep(DELAY_MS);
        return { description: text, shortAlt };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');
        const isTimeout = msg.includes('[Timeout]');

        if (isRateLimit) {
          consecutiveFails++;
          if (consecutiveFails >= 3) {
            console.warn('[Gemini] Rate limit liên tiếp 3 lần — pause 30s');
            await sleep(RATE_LIMIT_PAUSE_MS);
            consecutiveFails = 0;
          } else {
            await sleep(RATE_LIMIT_DELAY_MS);
          }
          continue;
        }

        if (isTimeout && attempt === 0) {
          console.warn('[Gemini] Timeout — retry 1 lần');
          continue;
        }

        // Lỗi khác hoặc đã retry đủ lần
        console.error(`[Gemini] describeImage fail attempt ${attempt}:`, msg);
        if (attempt >= 1) break;
      }
    }

    return { description: '[Không thể mô tả hình này]', shortAlt: 'Hình minh họa' };
  }

  async convertPdf(pdfPath: string, prompt: string): Promise<string> {
    const apiKey = await getApiKey();
    const model = await getSetting('ai_model');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-2.0-flash-lite' });

    const pdfBuffer = await fs.readFile(pdfPath);
    const base64 = pdfBuffer.toString('base64');

    let consecutiveFails = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await withTimeout(
          geminiModel.generateContent([
            { inlineData: { data: base64, mimeType: 'application/pdf' } },
            prompt,
          ]),
          TIMEOUT_MS
        );

        await sleep(DELAY_MS);
        return result.response.text().trim();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const isRateLimit = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED');

        if (isRateLimit) {
          consecutiveFails++;
          if (consecutiveFails >= 3) {
            await sleep(RATE_LIMIT_PAUSE_MS);
            consecutiveFails = 0;
          } else {
            await sleep(RATE_LIMIT_DELAY_MS);
          }
          continue;
        }

        console.error(`[Gemini] convertPdf fail attempt ${attempt}:`, msg);
        if (attempt >= 1) throw err;
      }
    }

    throw new Error('Gemini không thể convert PDF sau nhiều lần thử.');
  }
}

// ─── Singleton export ──────────────────────────────────────────────────────────

export const aiProvider: AIVisionProvider = new GeminiProvider();

// ─── Convenience exports ───────────────────────────────────────────────────────

export async function describeImage(
  imagePath: string
): Promise<{ description: string; shortAlt: string }> {
  const prompt = await getSetting('ai_image_prompt');
  return aiProvider.describeImage(imagePath, prompt);
}

// ─── Parallel batch describe ───────────────────────────────────────────────────
// Gọi song song tối đa `concurrency` request cùng lúc, delay 300ms giữa các chunk.
// Nếu 1 hình fail → trả fallback, không fail toàn batch. Kết quả theo đúng thứ tự input.

export async function describeImages(
  imagePaths: string[],
  concurrency = 5,
  onChunkDone?: (done: number, total: number) => void,
): Promise<Array<{ description: string; shortAlt: string }>> {
  const total = imagePaths.length;
  const results: Array<{ description: string; shortAlt: string }> = [];
  const prompt = await getSetting('ai_image_prompt');

  for (let i = 0; i < total; i += concurrency) {
    const chunk = imagePaths.slice(i, i + concurrency);

    const chunkResults = await Promise.allSettled(
      chunk.map(imagePath => aiProvider.describeImage(imagePath, prompt))
    );

    for (const r of chunkResults) {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      } else {
        console.error('[Gemini] describeImages item failed:', r.reason);
        results.push({ description: '[Không thể mô tả hình này]', shortAlt: 'Hình minh họa' });
      }
    }

    const done = Math.min(i + concurrency, total);
    onChunkDone?.(done, total);

    // Delay giữa các chunk (trừ chunk cuối) để tránh rate limit
    if (i + concurrency < total) {
      await sleep(300);
    }
  }

  return results;
}

export async function convertPdfWithAI(
  pdfPath: string
): Promise<string> {
  const prompt = await getSetting('ai_pdf_prompt');
  return aiProvider.convertPdf(pdfPath, prompt);
}
