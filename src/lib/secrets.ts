import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const rawKey = process.env.APP_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('APP_ENCRYPTION_KEY is not set. Add it to your environment before storing encrypted secrets.');
  }

  const key = Buffer.from(rawKey, 'base64');
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 encoded).');
  }

  return key;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(payload: string) {
  const [ivBase64, tagBase64, encryptedBase64] = payload.split(':');

  if (!ivBase64 || !tagBase64 || !encryptedBase64) {
    return payload;
  }

  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivBase64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
