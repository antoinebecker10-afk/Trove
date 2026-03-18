import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerListSourcesTool } from "./list-sources.js";

function createMockServer() {
  const tools: Record<string, { handler: Function }> = {};
  return {
    tool: vi.fn((name: string, _desc: string, _schema: any, handler: Function) => {
      tools[name] = { handler };
    }),
    _tools: tools,
  };
}

describe("registerListSourcesTool", () => {
  it("returns stats and source information", async () => {
    const server = createMockServer();
    const engine = {
      getStats: vi.fn().mockResolvedValue({
        totalItems: 15,
        byType: { file: 10, github: 5 },
        bySource: { local: 10, github: 5 },
        lastIndexedAt: "2025-06-01T00:00:00Z",
      }),
      getConfig: vi.fn().mockReturnValue({
        storage: "json",
        data_dir: "~/.trove",
        embeddings: "local",
        sources: [
          { connector: "local", config: {} },
          { connector: "github", config: { username: "user" } },
        ],
      }),
    };

    registerListSourcesTool(server as any, engine as any);

    const handler = server._tools["trove_list_sources"].handler;
    const result = await handler({});

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.totalItems).toBe(15);
    expect(parsed.sources).toHaveLength(2);
    expect(parsed.sources[0].connector).toBe("local");
    expect(parsed.sources[0].itemCount).toBe(10);
    expect(parsed.sources[1].connector).toBe("github");
    expect(parsed.sources[1].itemCount).toBe(5);
    expect(parsed.lastIndexedAt).toBe("2025-06-01T00:00:00Z");
  });
});
