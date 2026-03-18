import { describe, it, expect, beforeEach, vi } from "vitest";
import { JsonStore } from "./store.js";
import type { ContentItem } from "@trove/shared";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "test:item-1",
    source: "test",
    type: "file",
    title: "Test Item",
    description: "A test item",
    tags: ["test"],
    uri: "/path/to/file",
    metadata: {},
    indexedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("JsonStore", () => {
  let store: JsonStore;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "trove-test-"));
    store = new JsonStore(tempDir);
  });

  it("starts empty", async () => {
    const items = await store.getAllItems();
    expect(items).toEqual([]);
  });

  it("upserts and retrieves items", async () => {
    const item = makeItem();
    await store.upsertItems([item]);

    const retrieved = await store.getItem("test:item-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.title).toBe("Test Item");
  });

  it("returns null for non-existent item", async () => {
    const result = await store.getItem("nonexistent");
    expect(result).toBeNull();
  });

  it("upserts multiple items", async () => {
    const items = [
      makeItem({ id: "test:a" }),
      makeItem({ id: "test:b" }),
      makeItem({ id: "test:c" }),
    ];
    await store.upsertItems(items);

    const all = await store.getAllItems();
    expect(all).toHaveLength(3);
  });

  it("overwrites on duplicate id (upsert)", async () => {
    await store.upsertItems([makeItem({ id: "test:dup", title: "v1" })]);
    await store.upsertItems([makeItem({ id: "test:dup", title: "v2" })]);

    const item = await store.getItem("test:dup");
    expect(item!.title).toBe("v2");

    const all = await store.getAllItems();
    expect(all).toHaveLength(1);
  });

  it("clears all items", async () => {
    await store.upsertItems([makeItem({ id: "a" }), makeItem({ id: "b" })]);
    await store.clear();
    const all = await store.getAllItems();
    expect(all).toEqual([]);
  });

  it("clears items by source only", async () => {
    await store.upsertItems([
      makeItem({ id: "a", source: "github" }),
      makeItem({ id: "b", source: "local" }),
      makeItem({ id: "c", source: "github" }),
    ]);
    await store.clear("github");

    const all = await store.getAllItems();
    expect(all).toHaveLength(1);
    expect(all[0].source).toBe("local");
  });

  it("computes stats correctly", async () => {
    await store.upsertItems([
      makeItem({ id: "a", source: "github", type: "github", indexedAt: "2025-01-01T00:00:00Z" }),
      makeItem({ id: "b", source: "local", type: "file", indexedAt: "2025-06-01T00:00:00Z" }),
      makeItem({ id: "c", source: "local", type: "image", indexedAt: "2025-03-01T00:00:00Z" }),
    ]);

    const stats = await store.getStats();
    expect(stats.totalItems).toBe(3);
    expect(stats.bySource).toEqual({ github: 1, local: 2 });
    expect(stats.byType).toEqual({ github: 1, file: 1, image: 1 });
    expect(stats.lastIndexedAt).toBe("2025-06-01T00:00:00Z");
  });

  it("returns empty stats when no items", async () => {
    const stats = await store.getStats();
    expect(stats.totalItems).toBe(0);
    expect(stats.bySource).toEqual({});
    expect(stats.byType).toEqual({});
    expect(stats.lastIndexedAt).toBeNull();
  });

  it("searches by cosine similarity", async () => {
    // Create items with known embedding vectors
    await store.upsertItems([
      makeItem({ id: "a", embedding: [1, 0, 0] }),
      makeItem({ id: "b", embedding: [0, 1, 0] }),
      makeItem({ id: "c", embedding: [0.9, 0.1, 0] }),
    ]);

    // Search with a query vector close to item "a"
    const results = await store.search([1, 0, 0], 2);
    expect(results).toHaveLength(2);
    // Best match should be item "a" (exact match)
    expect(results[0].item.id).toBe("a");
    expect(results[0].score).toBeCloseTo(1.0);
    // Second best should be item "c" (close)
    expect(results[1].item.id).toBe("c");
  });

  it("skips items without embeddings in search", async () => {
    await store.upsertItems([
      makeItem({ id: "a", embedding: [1, 0, 0] }),
      makeItem({ id: "b" }), // no embedding
    ]);

    const results = await store.search([1, 0, 0], 10);
    expect(results).toHaveLength(1);
    expect(results[0].item.id).toBe("a");
  });

  it("persists data to disk and reloads", async () => {
    await store.upsertItems([makeItem({ id: "persist-test" })]);

    // Create a new store pointing to the same dir
    const store2 = new JsonStore(tempDir);
    const item = await store2.getItem("persist-test");
    expect(item).not.toBeNull();
    expect(item!.id).toBe("persist-test");
  });
});
