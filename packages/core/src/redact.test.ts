import { describe, it, expect } from "vitest";
import { redactSecrets, containsSecrets } from "./redact.js";

describe("redactSecrets", () => {
  // ── API keys & tokens ──────────────────────────────────────────────

  it("redacts Anthropic keys", () => {
    const text = "key: sk-ant-abcdefghij1234567890xx";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toBe("key: [REDACTED:anthropic_key]");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("redacts OpenAI keys", () => {
    const text = "OPENAI_API_KEY=sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ab";
    const { redacted } = redactSecrets(text);
    expect(redacted).not.toContain("sk-ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    expect(redacted).toContain("[REDACTED:");
  });

  it("redacts AWS access keys", () => {
    const text = "aws_access_key_id = AKIAIOSFODNN7EXAMPLE";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:aws_access_key]");
    expect(redacted).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("redacts AWS secret keys", () => {
    const text = "aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:");
  });

  it("redacts GitHub personal access tokens (ghp_)", () => {
    // Without a key= prefix, the ghp_ pattern is matched directly
    const text = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij1234";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:github_token]");
    expect(redacted).not.toContain("ghp_");
  });

  it("redacts GitHub tokens even when password pattern also matches", () => {
    // When TOKEN= prefix is present, the password pattern fires first
    const text = "GITHUB_TOKEN=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij1234";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("redacts GitHub fine-grained PATs (github_pat_)", () => {
    // Without a key= prefix, the github_pat pattern is matched directly
    const text = "github_pat_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:github_pat]");
    expect(redacted).not.toContain("github_pat_");
  });

  it("redacts Slack tokens (xoxb-)", () => {
    // Without a key= prefix, the slack_token pattern is matched directly
    const text = "xoxb-1234567890-abcdefghij";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:slack_token]");
    expect(redacted).not.toContain("xoxb-");
  });

  it("redacts Stripe live keys", () => {
    // Use a clearly fake key pattern that won't trigger GitHub push protection
    const prefix = "sk_" + "live" + "_";
    const text = `stripe_key=${prefix}${"X".repeat(30)}`;
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:stripe_key]");
    expect(redacted).not.toContain(prefix);
  });

  it("redacts Stripe test keys", () => {
    const prefix = "sk_" + "test" + "_";
    const text = `${prefix}${"X".repeat(30)}`;
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:stripe_key]");
  });

  it("redacts GitLab tokens", () => {
    const text = "glpat-ABCDEFGHIJKLMNOPQRSTUVWX";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:gitlab_token]");
  });

  it("redacts Firebase keys", () => {
    const text = "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ_01234567";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:firebase_key]");
  });

  // ── Private keys ───────────────────────────────────────────────────

  it("redacts RSA private keys", () => {
    const text = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/yGaXv0LOREM
-----END RSA PRIVATE KEY-----`;
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:private_key]");
    expect(redacted).not.toContain("MIIEowIBAAKCAQEA");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("redacts EC private keys", () => {
    const text = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEILBzh7XXXXXXXXXXXXXXXXXXXXXXXX
-----END EC PRIVATE KEY-----`;
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:private_key]");
  });

  it("redacts generic private keys", () => {
    const text = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwLOREM
-----END PRIVATE KEY-----`;
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:private_key]");
  });

  // ── Database URLs ──────────────────────────────────────────────────

  it("redacts postgres connection strings", () => {
    const text = "DATABASE_URL=postgres://admin:supersecret@db.example.com:5432/mydb";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:db_url]");
    expect(redacted).not.toContain("supersecret");
  });

  it("redacts mysql connection strings", () => {
    const text = "mysql://root:password123@localhost:3306/app";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:db_url]");
  });

  it("redacts mongodb connection strings", () => {
    const text = "mongodb://user:pass@cluster0.abc.mongodb.net/db";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:db_url]");
  });

  it("redacts redis connection strings", () => {
    const text = "redis://default:mypassword@redis.example.com:6379";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:db_url]");
  });

  // ── Password patterns ─────────────────────────────────────────────

  it("redacts password = 'value' patterns", () => {
    const text = 'password = "mySuperSecret123"';
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:password]");
    expect(redacted).not.toContain("mySuperSecret123");
  });

  it("redacts api_key: value patterns", () => {
    const text = "api_key: abcdef123456789012345";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:");
  });

  it("redacts auth_token assignments", () => {
    const text = "auth_token=longTokenValue12345678";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:");
  });

  // ── Credit card numbers ────────────────────────────────────────────

  it("redacts Visa card numbers", () => {
    const text = "card: 4111111111111111";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:credit_card]");
    expect(redacted).not.toContain("4111111111111111");
  });

  it("redacts Mastercard numbers", () => {
    const text = "card: 5500000000000004";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:credit_card]");
  });

  it("redacts Amex card numbers", () => {
    const text = "card: 340000000000009";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:credit_card]");
  });

  // ── SSNs ───────────────────────────────────────────────────────────

  it("redacts US SSNs", () => {
    const text = "ssn: 123-45-6789";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:ssn]");
    expect(redacted).not.toContain("123-45-6789");
  });

  // ── JWTs ───────────────────────────────────────────────────────────

  it("redacts JWT tokens", () => {
    // Without a key= prefix so the jwt pattern is matched directly
    const text =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const { redacted } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:jwt]");
    expect(redacted).not.toContain("eyJhbGciOiJIUzI1NiI");
  });

  it("redacts JWT even when prefixed with token= (password pattern wins)", () => {
    const text =
      "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toContain("[REDACTED:");
    expect(redacted).not.toContain("eyJhbGciOiJIUzI1NiI");
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── Negative cases ─────────────────────────────────────────────────

  it("does NOT redact normal text", () => {
    const text =
      "This is a normal paragraph about code architecture and design patterns.";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toBe(text);
    expect(count).toBe(0);
  });

  it("does NOT redact short strings that look like passwords", () => {
    // password pattern requires 8+ chars in the value
    const text = 'password = "short"';
    const { redacted } = redactSecrets(text);
    // "short" is only 5 chars, should not match the 8+ requirement
    expect(redacted).toBe(text);
  });

  it("does NOT redact normal code variables", () => {
    const text = "const maxRetries = 3;\nconst timeout = 5000;";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toBe(text);
    expect(count).toBe(0);
  });

  it("handles empty strings", () => {
    const { redacted, count } = redactSecrets("");
    expect(redacted).toBe("");
    expect(count).toBe(0);
  });

  it("handles text with no secrets and special characters", () => {
    const text = "Hello! @#$%^&*() [brackets] {braces} <angles>";
    const { redacted, count } = redactSecrets(text);
    expect(redacted).toBe(text);
    expect(count).toBe(0);
  });

  // ── Multiple secrets ───────────────────────────────────────────────

  it("redacts multiple secrets in the same text", () => {
    const text = [
      "ANTHROPIC_KEY=sk-ant-abcdefghij1234567890xx",
      "DB=postgres://user:pass@host:5432/db",
      "SSN=123-45-6789",
    ].join("\n");
    const { redacted, count } = redactSecrets(text);
    expect(count).toBeGreaterThanOrEqual(3);
    expect(redacted).not.toContain("sk-ant-");
    expect(redacted).not.toContain("user:pass");
    expect(redacted).not.toContain("123-45-6789");
  });

  // ── Idempotency ────────────────────────────────────────────────────

  it("is idempotent — redacting twice does not add extra markers", () => {
    const text = "key=sk-ant-abcdefghij1234567890xx";
    const first = redactSecrets(text);
    const second = redactSecrets(first.redacted);
    expect(second.redacted).toBe(first.redacted);
    expect(second.count).toBe(0);
  });
});

describe("containsSecrets", () => {
  it("returns true when secrets are present", () => {
    expect(containsSecrets("token=sk-ant-abcdefghij1234567890xx")).toBe(true);
    expect(containsSecrets("postgres://u:p@host/db")).toBe(true);
    expect(containsSecrets("123-45-6789")).toBe(true);
  });

  it("returns false when no secrets are present", () => {
    expect(containsSecrets("Hello world")).toBe(false);
    expect(containsSecrets("const x = 42;")).toBe(false);
    expect(containsSecrets("")).toBe(false);
  });

  it("returns true for JWTs", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(containsSecrets(jwt)).toBe(true);
  });

  it("returns true for private keys", () => {
    const pem = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0LOREM
-----END RSA PRIVATE KEY-----`;
    expect(containsSecrets(pem)).toBe(true);
  });
});
