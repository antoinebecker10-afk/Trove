#!/usr/bin/env node

import { Command } from "commander";
import { registerBuiltinConnector } from "@trove/core";

// Register built-in connectors
registerBuiltinConnector("local", async () => {
  const mod = await import("@trove/connector-local");
  return mod.default;
});
registerBuiltinConnector("github", async () => {
  const mod = await import("@trove/connector-github");
  return mod.default;
});

// Load .env file if present (dotenv-free: use Node 20+ built-in)
try {
  const { loadEnvFile } = await import("node:process");
  loadEnvFile?.();
} catch {
  // .env not found or loadEnvFile not available — that's fine
}

const program = new Command();

program
  .name("trove")
  .description(
    "🦞 Trove — Your content. All of it.\nSemantic search across GitHub repos, local files, screenshots, videos.",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Initialize Trove in the current directory")
  .option("-d, --dir <path>", "Target directory")
  .action(async (opts) => {
    const { initCommand } = await import("./commands/init.js");
    await initCommand(opts);
  });

program
  .command("index [source]")
  .description("Index content from configured sources")
  .option("-v, --verbose", "Verbose output")
  .action(async (source, opts) => {
    const { indexCommand } = await import("./commands/index-cmd.js");
    await indexCommand(source, opts);
  });

program
  .command("search <query>")
  .description("Search across all indexed content")
  .option("-t, --type <type>", "Filter by type (github, file, image, video, document)")
  .option("-l, --limit <n>", "Max results", "10")
  .option("--json", "Output as JSON")
  .action(async (query, opts) => {
    const { searchCommand } = await import("./commands/search.js");
    await searchCommand(query, { ...opts, limit: parseInt(opts.limit, 10) });
  });

program
  .command("status")
  .description("Show index statistics")
  .action(async () => {
    const { statusCommand } = await import("./commands/status.js");
    await statusCommand();
  });

program
  .command("mcp")
  .description("Start MCP server (stdio mode for Claude Code)")
  .action(async () => {
    const { mcpCommand } = await import("./commands/mcp.js");
    await mcpCommand();
  });

program.parse();
