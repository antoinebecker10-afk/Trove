import { describe, it, expect, afterEach } from "vitest";
import { encrypt, decrypt, isEncrypted, getEncryptionKey } from "./crypto.js";

describe("encrypt / decrypt", () => {
  const passphrase = "test-passphrase-2024";

  it("round-trips: encrypt then decrypt returns original text", () => {
    const plaintext = "Hello, Trove! This is a secret index.";
    const encrypted = encrypt(plaintext, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypting empty string produces data that is too short to decrypt (no ciphertext bytes)", () => {
    // AES-GCM with empty plaintext produces 0 ciphertext bytes,
    // so the buffer is exactly salt(16) + iv(12) + authTag(16) = 44 bytes.
    // The decrypt function requires at least 45 bytes (header + 1 byte ciphertext).
    const encrypted = encrypt("", passphrase);
    expect(encrypted.length).toBe(44);
    expect(() => decrypt(encrypted, passphrase)).toThrow(
      "Encrypted data is too short or corrupted",
    );
  });

  it("handles large text encryption", () => {
    const largeText = "A".repeat(100_000);
    const encrypted = encrypt(largeText, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(largeText);
  });

  it("handles unicode content", () => {
    const text = "Bonjour le monde! Trove indexe tout. Emojis";
    const encrypted = encrypt(text, passphrase);
    const decrypted = decrypt(encrypted, passphrase);
    expect(decrypted).toBe(text);
  });

  it("throws with wrong passphrase", () => {
    const encrypted = encrypt("secret data", passphrase);
    expect(() => decrypt(encrypted, "wrong-passphrase")).toThrow();
  });

  it("throws with corrupted data", () => {
    const encrypted = encrypt("some data", passphrase);
    // Flip bits in the ciphertext portion
    encrypted[encrypted.length - 1] ^= 0xff;
    encrypted[encrypted.length - 2] ^= 0xff;
    expect(() => decrypt(encrypted, passphrase)).toThrow();
  });

  it("throws when data is too short", () => {
    const tooShort = Buffer.alloc(10);
    expect(() => decrypt(tooShort, passphrase)).toThrow(
      "Encrypted data is too short or corrupted",
    );
  });

  it("produces different ciphertexts for the same plaintext (random salt/IV)", () => {
    const text = "same plaintext";
    const a = encrypt(text, passphrase);
    const b = encrypt(text, passphrase);
    expect(a.equals(b)).toBe(false);
  });

  it("produces different ciphertexts with different passphrases", () => {
    const text = "identical content";
    const a = encrypt(text, "passphrase-one");
    const b = encrypt(text, "passphrase-two");
    expect(a.equals(b)).toBe(false);
  });
});

describe("isEncrypted", () => {
  const passphrase = "detect-test";

  it("returns true for encrypted data", () => {
    const encrypted = encrypt("test data", passphrase);
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("returns false for plaintext JSON array", () => {
    const json = Buffer.from('[{"id":"1","title":"test"}]', "utf-8");
    expect(isEncrypted(json)).toBe(false);
  });

  it("returns false for plaintext JSON object", () => {
    const json = Buffer.from('{"items":[]}', "utf-8");
    expect(isEncrypted(json)).toBe(false);
  });

  it("returns false for data that is too short", () => {
    expect(isEncrypted(Buffer.alloc(10))).toBe(false);
    expect(isEncrypted(Buffer.alloc(0))).toBe(false);
  });
});

describe("getEncryptionKey", () => {
  const originalEnv = process.env.TROVE_ENCRYPTION_KEY;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.TROVE_ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.TROVE_ENCRYPTION_KEY;
    }
  });

  it("returns the key when TROVE_ENCRYPTION_KEY is set", () => {
    process.env.TROVE_ENCRYPTION_KEY = "my-secret-key";
    expect(getEncryptionKey()).toBe("my-secret-key");
  });

  it("returns null when TROVE_ENCRYPTION_KEY is not set", () => {
    delete process.env.TROVE_ENCRYPTION_KEY;
    expect(getEncryptionKey()).toBeNull();
  });
});
