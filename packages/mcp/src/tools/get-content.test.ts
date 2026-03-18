import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerGetContentTool } from "./get-content.js";

function createMockEngine() {
  return {
    getItem: vi.fn(),
    search: vi.fn(),
    keywordSearch: vi.fn(),
    getStats: vi.fn(),
    getConfig: vi.fn(),
    index: vi.fn(),
  };
}

function createMockServer() {
  const tools: Record<string, { handler: Function }> = {};
  return {
    tool: vi.fn((name: string, _desc: string, _schema: any, handler: Function) => {
      tools[name] = { handler };
    }),
    _tools: tools,
  };
}

describe("registerGetContentTool", () => {
  let server: ReturnType<typeof createMockServer>;
  let engine: ReturnType<typeof createMockEngine>;

  beforeEach(() => {
    server = createMockServer();
    engine = createMockEngine();
    registerGetContentTool(server as any, engine as any);
  });

  it("registers the trove_get_content tool", () => {
    expect(server.tool).toHaveBeenCalledWith(
      "trove_get_content",
      expect.any(String),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("returns item details without embedding", async () => {
    engine.getItem.mockResolvedValue({
      id: "local:/file.ts",
      source: "local",
      type: "file",
      title: "file.ts",
      description: "A file",
      tags: ["ts"],
      uri: "/file.ts",
      metadata: { size: 100 },
      indexedAt: "2025-01-01T00:00:00Z",
      content: "const x = 1;",
      embedding: [0.1, 0.2, 0.3], // should be stripped
    });

    const handler = server._tools["trove_get_content"].handler;
    const result = await handler({ id: "local:/file.ts" });

    expect(result.isError).toBeUndefined();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.title).toBe("file.ts");
    expect(parsed.content).toBe("const x = 1;");
    // Embedding should be excluded
    expect(parsed.embedding).toBeUndefined();
  });

  it("returns error for non-existent item", async () => {
    engine.getItem.mockResolvedValue(null);

    const handler = server._tools["trove_get_content"].handler;
    const result = await handler({ id: "nonexistent" });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("Item not found");
  });
});
