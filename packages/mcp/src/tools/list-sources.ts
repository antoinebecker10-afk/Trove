import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { TroveEngine } from "@trove/core";

export function registerListSourcesTool(
  server: McpServer,
  engine: TroveEngine,
): void {
  server.tool(
    "trove_list_sources",
    "List all configured content sources and their index statistics",
    {},
    async () => {
      const stats = await engine.getStats();
      const config = engine.getConfig();

      const sources = config.sources.map((s) => ({
        connector: s.connector,
        itemCount: stats.bySource[s.connector] ?? 0,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalItems: stats.totalItems,
                lastIndexedAt: stats.lastIndexedAt,
                sources,
                byType: stats.byType,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
