# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Trove, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email: **security@trove.dev** (or use GitHub's private vulnerability reporting)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact

We will acknowledge your report within 48 hours and work with you to resolve it.

## Security Design Principles

- **No hardcoded secrets**: API keys are loaded exclusively from environment variables at runtime.
- **Input validation**: All user input (queries, config, file paths) is validated with Zod schemas.
- **Path traversal protection**: The local connector validates all resolved paths against allowed roots using `realpath()`.
- **No browser-side secrets**: The web dashboard calls a backend API; API keys never reach the client.
- **Minimal dependencies**: We keep the dependency tree small to reduce supply chain risk.
- **XSS prevention**: React auto-escapes all rendered content; no `dangerouslySetInnerHTML` is used.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |
