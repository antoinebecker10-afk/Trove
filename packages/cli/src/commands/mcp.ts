import { startMcpServer } from "@trove/mcp";

/**
 * `trove mcp` — start the MCP server (stdio mode for Claude Code).
 *
 * Usage:
 *   claude mcp add trove -- npx trove mcp
 */
export async function mcpCommand(): Promise<void> {
  // No console.log here — stdout is the JSON-RPC channel
  await startMcpServer({ cwd: process.cwd() });
}
