# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-18

### Added
- **14 connectors**: Local Files, GitHub, Notion, Obsidian, Figma, Slack, Google Drive, Linear, Discord, Airtable, Dropbox, Confluence, Raindrop.io
- **Web dashboard**: dual-pane file manager, masonry launcher, semantic search with AI answers, sources panel, system monitor
- **MCP server**: 7 tools for Claude Code (`trove_find`, `trove_open`, `trove_locate`, `trove_search`, `trove_list_sources`, `trove_get_content`, `trove_reindex`)
- **CLI**: `npx trove-os init|index|search|status|mcp`
- **Search**: semantic search via local TF-IDF embeddings or Anthropic API, keyword fallback
- **Filters**: filter search results by content type (file, image, video, document, github) and by source (local, github, notion, obsidian, slack, figma)
- **AI answers**: local Ollama integration for natural language answers

### Security
- Sensitive file blocklist: 40+ patterns blocked from indexing (`.env`, `.pem`, `.key`, `.wallet`, `id_rsa`, credentials, seed phrases)
- Secret redaction: API keys, passwords, private keys, credit cards, JWTs, connection strings detected and replaced with `[REDACTED:type]` before storage
- AES-256-GCM encryption at rest for the index (opt-in via `TROVE_ENCRYPTION_KEY`)
- Auth token required on all web API requests
- CORS restricted to localhost, DNS rebinding protection
- File content never sent to external embedding APIs
- MCP tools refuse to read sensitive files
- Prompt injection defense: untrusted content markers on all MCP responses and Ollama context
- Path re-validation before every file read (prevents index poisoning)
- Atomic writes with restricted file permissions (`0600`)
- `execFile()` only (no shell injection), timing-safe token comparison, request body size limits, security headers
