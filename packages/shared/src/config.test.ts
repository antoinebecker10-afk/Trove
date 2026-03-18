import { describe, it, expect } from "vitest";
import { TroveConfigSchema, SourceConfigSchema } from "./config.js";

describe("SourceConfigSchema", () => {
  it("parses a valid source config", () => {
    const result = SourceConfigSchema.parse({
      connector: "github",
      config: { username: "testuser" },
    });
    expect(result.connector).toBe("github");
    expect(result.config).toEqual({ username: "testuser" });
  });

  it("defaults config to empty object", () => {
    const result = SourceConfigSchema.parse({ connector: "local" });
    expect(result.config).toEqual({});
  });

  it("rejects missing connector", () => {
    expect(() => SourceConfigSchema.parse({})).toThrow();
    expect(() => SourceConfigSchema.parse({ config: {} })).toThrow();
  });
});

describe("TroveConfigSchema", () => {
  it("parses with all defaults", () => {
    const result = TroveConfigSchema.parse({});
    expect(result.storage).toBe("json");
    expect(result.data_dir).toBe("~/.trove");
    expect(result.embeddings).toBe("local");
    expect(result.sources).toEqual([]);
  });

  it("parses a full config", () => {
    const result = TroveConfigSchema.parse({
      storage: "sqlite",
      data_dir: "/custom/path",
      embeddings: "anthropic",
      sources: [
        { connector: "github", config: { username: "user" } },
        { connector: "local", config: { paths: ["/home"] } },
      ],
    });
    expect(result.storage).toBe("sqlite");
    expect(result.data_dir).toBe("/custom/path");
    expect(result.embeddings).toBe("anthropic");
    expect(result.sources).toHaveLength(2);
  });

  it("rejects invalid storage backend", () => {
    expect(() =>
      TroveConfigSchema.parse({ storage: "postgres" }),
    ).toThrow();
  });

  it("rejects invalid embeddings provider", () => {
    expect(() =>
      TroveConfigSchema.parse({ embeddings: "openai" }),
    ).toThrow();
  });
});
