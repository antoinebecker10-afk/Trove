import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerReindexTool } from "./reindex.js";

function createMockServer() {
  const tools: Record<string, { handler: Function }> = {};
  return {
    tool: vi.fn((name: string, _desc: string, _schema: any, handler: Function) => {
      tools[name] = { handler };
    }),
    _tools: tools,
  };
}

describe("registerReindexTool", () => {
  it("reindexes all sources when no source specified", async () => {
    const server = createMockServer();
    const engine = { index: vi.fn().mockResolvedValue(42) };

    registerReindexTool(server as any, engine as any);

    const handler = server._tools["trove_reindex"].handler;
    const result = await handler({});

    expect(engine.index).toHaveBeenCalledWith(undefined);
    expect(result.content[0].text).toContain("42");
    expect(result.content[0].text).toContain("all sources");
  });

  it("reindexes a specific source", async () => {
    const server = createMockServer();
    const engine = { index: vi.fn().mockResolvedValue(10) };

    registerReindexTool(server as any, engine as any);

    const handler = server._tools["trove_reindex"].handler;
    const result = await handler({ source: "github" });

    expect(engine.index).toHaveBeenCalledWith("github");
    expect(result.content[0].text).toContain("10");
    expect(result.content[0].text).toContain('"github"');
  });
});
