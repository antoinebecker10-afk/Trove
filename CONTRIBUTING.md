# Contributing to Trove

Thanks for your interest in contributing! Trove is built by creators, for creators.

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/trove.git
cd trove
pnpm install
pnpm build
```

## Project Structure

```
packages/
  shared/         # Shared types and schemas (@trove/shared)
  core/           # Engine, indexer, store, embeddings (@trove/core)
  connectors/
    local/        # Local filesystem connector (@trove/connector-local)
    github/       # GitHub repos connector (@trove/connector-github)
  mcp/            # MCP server for Claude Code (@trove/mcp)
  cli/            # CLI tool — `npx trove-os` (@trove/cli → published as `trove-os`)
  web/            # React web dashboard (@trove/web)
```

## How to Contribute

### Bug Fixes
1. Look for issues labeled `good first issue`
2. Fork, branch, fix, test, PR

### New Connector
This is the easiest high-impact contribution. A connector is a single file that implements the `Connector` interface:

```typescript
import type { Connector } from "@trove/shared";

const connector: Connector = {
  manifest: { name: "notion", version: "0.1.0", description: "...", configSchema: z.object({}) },
  async validate(config) { return { valid: true }; },
  async *index(config, options) { /* yield ContentItem objects */ },
};
export default connector;
```

See `packages/connectors/local/src/index.ts` for a complete example.

### UI Improvements
- Screenshot before/after in your PR description
- Keep the cyberpunk terminal aesthetic

## Development Commands

```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm dev            # Watch mode for all packages
```

## Code Style

- TypeScript strict mode
- ESM only (`"type": "module"`)
- Vitest for tests
- Zod for validation
- No `any` types

## Pull Request Process

1. Branch from `main`
2. Keep changes focused (one feature/fix per PR)
3. Add/update tests if applicable
4. Run `pnpm build && pnpm test` before pushing
5. Describe what changed and why in the PR description
