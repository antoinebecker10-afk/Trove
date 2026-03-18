import { describe, it, expect } from "vitest";
import { ContentItemSchema, ContentTypeEnum } from "./content-item.js";

describe("ContentTypeEnum", () => {
  it("accepts valid content types", () => {
    const valid = ["github", "file", "image", "video", "document", "bookmark"];
    for (const t of valid) {
      expect(ContentTypeEnum.parse(t)).toBe(t);
    }
  });

  it("rejects invalid content type", () => {
    expect(() => ContentTypeEnum.parse("podcast")).toThrow();
    expect(() => ContentTypeEnum.parse("")).toThrow();
    expect(() => ContentTypeEnum.parse(42)).toThrow();
  });
});

describe("ContentItemSchema", () => {
  const validItem = {
    id: "local:/home/user/file.ts",
    source: "local",
    type: "file",
    title: "file.ts",
    description: "A TypeScript file",
    tags: ["ts", "code"],
    uri: "/home/user/file.ts",
    metadata: { size: 1024 },
    indexedAt: "2025-01-01T00:00:00.000Z",
  };

  it("parses a valid content item", () => {
    const result = ContentItemSchema.parse(validItem);
    expect(result.id).toBe(validItem.id);
    expect(result.source).toBe("local");
    expect(result.type).toBe("file");
    expect(result.tags).toEqual(["ts", "code"]);
  });

  it("accepts optional content field", () => {
    const withContent = { ...validItem, content: "const x = 1;" };
    const result = ContentItemSchema.parse(withContent);
    expect(result.content).toBe("const x = 1;");
  });

  it("accepts optional embedding field", () => {
    const withEmbedding = { ...validItem, embedding: [0.1, 0.2, 0.3] };
    const result = ContentItemSchema.parse(withEmbedding);
    expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it("defaults content and embedding to undefined", () => {
    const result = ContentItemSchema.parse(validItem);
    expect(result.content).toBeUndefined();
    expect(result.embedding).toBeUndefined();
  });

  it("rejects missing required fields", () => {
    expect(() => ContentItemSchema.parse({})).toThrow();
    expect(() => ContentItemSchema.parse({ id: "test" })).toThrow();
  });

  it("rejects invalid type field", () => {
    expect(() =>
      ContentItemSchema.parse({ ...validItem, type: "podcast" }),
    ).toThrow();
  });

  it("rejects non-array tags", () => {
    expect(() =>
      ContentItemSchema.parse({ ...validItem, tags: "not-an-array" }),
    ).toThrow();
  });

  it("rejects non-string id", () => {
    expect(() =>
      ContentItemSchema.parse({ ...validItem, id: 123 }),
    ).toThrow();
  });

  it("accepts empty tags array", () => {
    const result = ContentItemSchema.parse({ ...validItem, tags: [] });
    expect(result.tags).toEqual([]);
  });

  it("accepts arbitrary metadata", () => {
    const meta = { stars: 42, language: "TypeScript", nested: { a: 1 } };
    const result = ContentItemSchema.parse({ ...validItem, metadata: meta });
    expect(result.metadata).toEqual(meta);
  });
});
