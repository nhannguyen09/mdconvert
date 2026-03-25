// lib/crypto.ts
// AES-256-GCM encrypt/decrypt cho ai_api_key
// Key lấy từ NEXTAUTH_SECRET (đã có trong .env)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // GCM standard
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET chưa được cấu hình');
  // Derive 32-byte key từ secret bằng SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: iv(hex):tag(hex):ciphertext(hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) throw new Error('Định dạng ciphertext không hợp lệ');

  const [ivHex, tagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

// Mask API key cho display: "AIza...xxxx" (giữ 4 đầu + 4 cuối)
export function maskApiKey(key: string): string {
  if (!key || key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
