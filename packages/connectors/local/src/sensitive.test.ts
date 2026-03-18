/**
 * Tests for the isSensitiveFile function in the local connector.
 *
 * Since isSensitiveFile is not exported, we replicate the exact logic here
 * from the source to test it in isolation. If the implementation changes,
 * these tests should be updated to match.
 */
import { describe, it, expect } from "vitest";
import { extname } from "node:path";

// ── Replicated from packages/connectors/local/src/index.ts ──────────

const SENSITIVE_EXTS = new Set([
  ".pem", ".key", ".p12", ".pfx", ".jks", ".keystore",
  ".kdbx", ".kdb",
  ".wallet", ".dat",
  ".gpg", ".pgp", ".asc",
  ".ovpn",
]);

const SENSITIVE_FILENAMES = new Set([
  ".env", ".env.local", ".env.production", ".env.development", ".env.staging",
  ".env.test", ".env.prod", ".env.dev",
  "credentials", "credentials.json", "credentials.yml",
  "secrets.json", "secrets.yml", "secrets.yaml",
  ".netrc", ".npmrc", ".pypirc",
  "id_rsa", "id_ed25519", "id_ecdsa", "id_dsa",
  "known_hosts", "authorized_keys",
  "htpasswd", ".htpasswd",
  "shadow", "passwd",
  "master.key", "production.key",
  "token.json", "tokens.json",
  "service-account.json", "service_account.json",
  "keyfile.json",
]);

const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/,
  /^id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/,
  /secret/i,
  /password/i,
  /private[_-]?key/i,
  /wallet\.dat$/i,
  /seed\.txt$/i,
  /mnemonic/i,
  /recovery[_-]?phrase/i,
];

function isSensitiveFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  const ext = extname(lower);
  if (SENSITIVE_EXTS.has(ext)) return true;
  if (SENSITIVE_FILENAMES.has(lower)) return true;
  return SENSITIVE_PATTERNS.some((p) => p.test(lower));
}

// ── Tests ────────────────────────────────────────────────────────────

describe("isSensitiveFile", () => {
  // ── .env files ─────────────────────────────────────────────────────

  describe("env files", () => {
    it.each([
      ".env",
      ".env.local",
      ".env.production",
      ".env.development",
      ".env.staging",
      ".env.test",
      ".env.prod",
      ".env.dev",
      ".env.custom",
    ])("blocks %s", (filename) => {
      expect(isSensitiveFile(filename)).toBe(true);
    });
  });

  // ── Key / certificate files ────────────────────────────────────────

  describe("key and certificate extensions", () => {
    it.each([
      "server.pem",
      "private.key",
      "cert.p12",
      "keystore.pfx",
      "app.jks",
      "my.keystore",
      "crypto.wallet",
      "backup.dat",
    ])("blocks %s", (filename) => {
      expect(isSensitiveFile(filename)).toBe(true);
    });
  });

  // ── Encrypted / signed files ───────────────────────────────────────

  describe("encrypted and signed file extensions", () => {
    it.each(["secret.gpg", "message.pgp", "key.asc", "vpn.ovpn"])(
      "blocks %s",
      (filename) => {
        expect(isSensitiveFile(filename)).toBe(true);
      },
    );
  });

  // ── SSH keys ───────────────────────────────────────────────────────

  describe("SSH keys", () => {
    it.each(["id_rsa", "id_ed25519", "id_ecdsa", "id_dsa"])(
      "blocks %s",
      (filename) => {
        expect(isSensitiveFile(filename)).toBe(true);
      },
    );

    it("blocks id_rsa.pub via pattern", () => {
      expect(isSensitiveFile("id_rsa.pub")).toBe(true);
    });

    it("blocks id_ed25519.pub via pattern", () => {
      expect(isSensitiveFile("id_ed25519.pub")).toBe(true);
    });
  });

  // ── Credential files ──────────────────────────────────────────────

  describe("credential files", () => {
    it.each([
      "credentials.json",
      "credentials.yml",
      "secrets.json",
      "secrets.yml",
      "secrets.yaml",
      "service-account.json",
      "service_account.json",
      "keyfile.json",
      "token.json",
      "tokens.json",
      "master.key",
      "production.key",
    ])("blocks %s", (filename) => {
      expect(isSensitiveFile(filename)).toBe(true);
    });
  });

  // ── Pattern-based detection ────────────────────────────────────────

  describe("sensitive name patterns", () => {
    it.each([
      "my-password.txt",
      "db_password_backup.sql",
      "secret-config.json",
      "app-secrets.yml",
      "mnemonic.txt",
      "my-mnemonic-phrase.txt",
      "wallet.dat",
      "seed.txt",
      "recovery-phrase.txt",
      "recovery_phrase.bak",
      "private_key.pem",
      "privatekey.json",
      "private-key.txt",
    ])("blocks %s", (filename) => {
      expect(isSensitiveFile(filename)).toBe(true);
    });
  });

  // ── Case insensitivity ─────────────────────────────────────────────

  describe("case insensitivity", () => {
    it("blocks .ENV (uppercase)", () => {
      expect(isSensitiveFile(".ENV")).toBe(true);
    });

    it("blocks .Env.Local (mixed case)", () => {
      expect(isSensitiveFile(".Env.Local")).toBe(true);
    });

    it("blocks SECRETS.JSON", () => {
      expect(isSensitiveFile("SECRETS.JSON")).toBe(true);
    });

    it("blocks ID_RSA", () => {
      expect(isSensitiveFile("ID_RSA")).toBe(true);
    });

    it("blocks My-PASSWORD-file.txt", () => {
      expect(isSensitiveFile("My-PASSWORD-file.txt")).toBe(true);
    });

    it("blocks MNEMONIC.TXT", () => {
      expect(isSensitiveFile("MNEMONIC.TXT")).toBe(true);
    });
  });

  // ── Normal files that should NOT be blocked ────────────────────────

  describe("normal files (should NOT be blocked)", () => {
    it.each([
      "index.ts",
      "README.md",
      "package.json",
      "main.js",
      "styles.css",
      "app.py",
      "Cargo.toml",
      "vitest.config.ts",
      "tsconfig.json",
      "hello.rs",
      "photo.png",
      "document.pdf",
      "data.csv",
      "config.yml",
      "Dockerfile",
      "Makefile",
    ])("allows %s", (filename) => {
      expect(isSensitiveFile(filename)).toBe(false);
    });
  });

  // ── Password manager files ─────────────────────────────────────────

  describe("password manager databases", () => {
    it.each(["vault.kdbx", "passwords.kdb"])(
      "blocks %s",
      (filename) => {
        expect(isSensitiveFile(filename)).toBe(true);
      },
    );
  });

  // ── System auth files ──────────────────────────────────────────────

  describe("system auth files", () => {
    it.each([".netrc", ".npmrc", ".pypirc", ".htpasswd", "htpasswd", "shadow", "passwd"])(
      "blocks %s",
      (filename) => {
        expect(isSensitiveFile(filename)).toBe(true);
      },
    );
  });
});
