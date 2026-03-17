<p align="center">
  <img src="assets/banner.png" width="800" alt="Trove banner" />
</p>

<h1 align="center">🦞 Trove</h1>

<p align="center">
  <strong>Your content. All of it.</strong><br/>
  Semantic search across GitHub repos, local files, screenshots, videos — one index, one search bar.
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen" alt="Node.js" /></a>
</p>

---

## Why Trove?

Every creator has their work scattered across GitHub, local folders, screenshots, Figma, videos, docs. Finding that one terrain screenshot from last week? That API design doc? That demo video?

**Trove indexes everything you create and makes it searchable — locally, privately, instantly.**

- **Semantic search** — find content by meaning, not just keywords
- **Plugin connectors** — GitHub, local filesystem, and more coming (Notion, Figma, Discord)
- **MCP server** — ask Claude Code "find my terrain screenshots" directly from your IDE
- **Zero cloud** — everything runs locally, your data stays yours
- **Cyberpunk terminal UI** — because developers deserve beautiful tools

## Quick Start

```bash
npx trove init        # scaffold config
npx trove index       # index your content
npx trove search "terrain heightmap"
```

## Use with Claude Code (MCP)

```bash
claude mcp add trove -- npx trove mcp
```

Then ask Claude:
> "Find my Bevy terrain screenshots from last week"

> "What repos do I have about multiplayer?"

> "Show me my BPMN diagrams"

## CLI Commands

```bash
trove init             # Initialize config in current directory
trove index [source]   # Index content from all or specific source
trove search <query>   # Semantic search from terminal
trove status           # Show index statistics
trove mcp              # Start MCP server (stdio, for Claude Code)
```

## Configuration

Create `.trove.yml` (or run `trove init`):

```yaml
storage: json
data_dir: ~/.trove
embeddings: local    # or "anthropic" for AI-powered search

sources:
  - connector: local
    config:
      paths: [~/projects, ~/Documents/screenshots]
      extensions: [".md", ".ts", ".rs", ".png", ".mp4", ".pdf"]
      ignore: ["node_modules", ".git", "dist"]

  - connector: github
    config:
      username: your-username
```

API keys go in `.env` (never in config):
```bash
ANTHROPIC_API_KEY=sk-...   # optional: enables AI search
GITHUB_TOKEN=ghp_...       # optional: private repos + higher rate limits
```

## Architecture

```
Sources          Connectors          Engine            Interfaces
─────────       ───────────         ────────          ──────────
GitHub    ──→  connector-github ──→              ──→  CLI
Local FS  ──→  connector-local ──→  Trove Core  ──→  Web Dashboard
Notion    ──→  connector-notion──→   (index +   ──→  MCP Server
Figma     ──→  connector-figma ──→   search)
```

## Writing a Connector

Every source is a plugin. A connector is a single TypeScript file:

```typescript
import type { Connector } from "@trove/shared";

const connector: Connector = {
  manifest: { name: "notion", version: "0.1.0", description: "Index Notion pages", configSchema: z.object({ database_id: z.string() }) },
  async validate(config) { return { valid: true }; },
  async *index(config, options) {
    // yield ContentItem objects
  },
};
export default connector;
```

Publish as `trove-connector-{name}` or `@trove/connector-{name}` on npm.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Packages

| Package | Description |
|---------|-------------|
| `trove` | CLI tool (`npx trove`) |
| `@trove/core` | Engine, indexer, store, embeddings |
| `@trove/shared` | Shared types and schemas |
| `@trove/mcp` | MCP server for Claude Code |
| `@trove/connector-local` | Local filesystem connector |
| `@trove/connector-github` | GitHub repos connector |
| `@trove/web` | Web dashboard |

## Contributing

We welcome contributions! The easiest way to start is writing a new connector.

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

## License

[MIT](LICENSE)
