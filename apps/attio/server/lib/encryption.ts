import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { env } from '@server/env';

const ENCRYPTION_PREFIX = 'enc:v1:';

function getEncryptionSecret() {
  const secret =
    env.APP_DATA_ENCRYPTION_KEY ??
    (env.NODE_ENV === 'test'
      ? 'test-data-encryption-secret-0123456789abcdef'
      : undefined);

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

function getEncryptionKey() {
  const secret = getEncryptionSecret();

  if (!secret) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'APP_DATA_ENCRYPTION_KEY must be set to encrypt stored credentials.',
      );
    }

    return null;
  }

  return createHash('sha256').update(secret).digest();
}

export function encryptSensitiveValue(value: string) {
  if (value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString('base64url')}:${authTag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

export function decryptSensitiveValue(value: string) {
  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    return value;
  }

  const key = getEncryptionKey();
  if (!key) {
    return value;
  }

  const encoded = value.slice(ENCRYPTION_PREFIX.length);
  const [ivBase64, authTagBase64, ciphertextBase64] = encoded.split(':');

  if (!ivBase64 || !authTagBase64 || !ciphertextBase64) {
    throw new Error('Encrypted value is malformed.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivBase64, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
