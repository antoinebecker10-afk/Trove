import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TroveEngine } from "@trove/core";

export function registerReindexTool(
  server: McpServer,
  engine: TroveEngine,
): void {
  server.tool(
    "trove_reindex",
    "Re-index content from all sources or a specific source",
    {
      source: z
        .string()
        .optional()
        .describe("Source connector name to reindex (e.g. 'github', 'local'). Omit to reindex all."),
    },
    async ({ source }) => {
      const count = await engine.index(source);
      return {
        content: [
          {
            type: "text" as const,
            text: `Reindexed ${count} items${source ? ` from "${source}"` : " from all sources"}.`,
          },
        ],
      };
    },
  );
}
