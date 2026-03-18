/**
 * Index encryption at rest — AES-256-GCM.
 *
 * When TROVE_ENCRYPTION_KEY is set, the index is encrypted before writing
 * and decrypted when loading. The key is derived from the user's passphrase
 * using PBKDF2 with a random salt.
 *
 * File format: [salt:16 bytes][iv:12 bytes][authTag:16 bytes][ciphertext]
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100_000;

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Encrypt plaintext using AES-256-GCM with a passphrase.
 * Returns a Buffer containing: salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext: string, passphrase: string): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(passphrase, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: salt + iv + authTag + ciphertext
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt data encrypted with encrypt().
 * Returns the plaintext string.
 * Throws if passphrase is wrong or data is tampered.
 */
export function decrypt(data: Buffer, passphrase: string): string {
  if (data.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("Encrypted data is too short or corrupted");
  }

  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(passphrase, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf-8");
}

/**
 * Check if a file buffer looks like it was encrypted by us.
 * Heuristic: not valid UTF-8 JSON starting with '['.
 */
export function isEncrypted(data: Buffer): boolean {
  if (data.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) return false;
  // If it starts with '[' or '{', it's probably plaintext JSON
  const firstByte = data[0];
  return firstByte !== 0x5b && firstByte !== 0x7b; // '[' or '{'
}

/**
 * Get the encryption passphrase from environment.
 * Returns null if encryption is not configured.
 */
export function getEncryptionKey(): string | null {
  return process.env.TROVE_ENCRYPTION_KEY ?? null;
}
