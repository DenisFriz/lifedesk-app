import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) throw new Error('ENCRYPTION_KEY env var is required');
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32)
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = ciphertext.split(':');
  if (!ivB64 || !tagB64 || !dataB64)
    throw new Error('Invalid ciphertext format');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString('utf8') + decipher.final('utf8');
}

export function encryptNullable(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  return encrypt(value);
}

export function decryptNullable(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  return decrypt(value);
}
