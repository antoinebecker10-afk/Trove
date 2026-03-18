/**
 * Secret redaction — scans text content for credentials, API keys,
 * private keys, and other sensitive patterns before indexing.
 *
 * Detected secrets are replaced with [REDACTED:type] markers.
 * The original content is NEVER stored in the index.
 */

interface RedactionPattern {
  name: string;
  pattern: RegExp;
}

const PATTERNS: RedactionPattern[] = [
  // API keys & tokens
  { name: "anthropic_key", pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/g },
  { name: "openai_key", pattern: /sk-[a-zA-Z0-9]{20,}/g },
  { name: "aws_access_key", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "aws_secret_key", pattern: /(?:aws_secret_access_key|AWS_SECRET)\s*[=:]\s*[A-Za-z0-9/+=]{30,}/g },
  { name: "github_token", pattern: /gh[ps]_[a-zA-Z0-9]{36,}/g },
  { name: "github_pat", pattern: /github_pat_[a-zA-Z0-9_]{30,}/g },
  { name: "gitlab_token", pattern: /glpat-[a-zA-Z0-9_-]{20,}/g },
  { name: "slack_token", pattern: /xox[bpras]-[a-zA-Z0-9-]{10,}/g },
  { name: "stripe_key", pattern: /[sr]k_(live|test)_[a-zA-Z0-9]{20,}/g },
  { name: "twilio_key", pattern: /SK[a-f0-9]{32}/g },
  { name: "sendgrid_key", pattern: /SG\.[a-zA-Z0-9_-]{22,}\.[a-zA-Z0-9_-]{22,}/g },
  { name: "notion_token", pattern: /ntn_[a-zA-Z0-9]{40,}/g },
  { name: "figma_token", pattern: /figd_[a-zA-Z0-9_-]{30,}/g },
  { name: "discord_token", pattern: /[MN][A-Za-z0-9]{23,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/g },
  { name: "heroku_key", pattern: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g },
  { name: "firebase_key", pattern: /AIza[a-zA-Z0-9_-]{35}/g },
  { name: "linear_token", pattern: /lin_api_[a-zA-Z0-9]{30,}/g },

  // Private keys (PEM format)
  { name: "private_key", pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----[\s\S]*?-----END\s+(RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE KEY-----/g },

  // Connection strings & database URLs
  { name: "db_url", pattern: /(?:postgres|mysql|mongodb|redis|amqp|mssql):\/\/[^\s"'`]+:[^\s"'`]+@[^\s"'`]+/g },

  // Generic password patterns (key = "value" or key: value)
  { name: "password", pattern: /(?:password|passwd|pwd|secret|token|api[_-]?key|apikey|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[=:]\s*["']?[^\s"'`,;]{8,}["']?/gi },

  // Crypto seed phrases (12 or 24 word mnemonics — heuristic)
  { name: "seed_phrase", pattern: /(?:abandon|ability|able|about|above|absent|absorb|abstract|absurd|abuse|access|accident|account|accuse|achieve|acid|acoustic|acquire|across|act)\s+(?:\w+\s+){10,22}\w+/gi },

  // Credit card numbers (basic patterns)
  { name: "credit_card", pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g },

  // SSN (US)
  { name: "ssn", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },

  // JWT tokens
  { name: "jwt", pattern: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },

  // Base64-encoded secrets (heuristic: env var = base64 string > 40 chars)
  { name: "base64_secret", pattern: /(?:SECRET|TOKEN|KEY|PASSWORD|PRIVATE)\s*[=:]\s*[A-Za-z0-9+/]{40,}={0,2}/gi },
];

/**
 * Redact secrets from text content. Returns the redacted text.
 * If no secrets are found, returns the original text unchanged.
 */
export function redactSecrets(text: string): { redacted: string; count: number } {
  let count = 0;
  let result = text;

  for (const { name, pattern } of PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    const matches = result.match(pattern);
    if (matches) {
      count += matches.length;
      result = result.replace(pattern, `[REDACTED:${name}]`);
    }
  }

  return { redacted: result, count };
}

/**
 * Check if text contains any detectable secrets.
 * Faster than redactSecrets when you only need a boolean.
 */
export function containsSecrets(text: string): boolean {
  for (const { pattern } of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  return false;
}
