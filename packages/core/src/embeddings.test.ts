import { describe, it, expect } from "vitest";
import { LocalEmbeddingProvider, createEmbeddingProvider } from "./embeddings.js";

describe("LocalEmbeddingProvider", () => {
  const provider = new LocalEmbeddingProvider();

  it("has 512 dimensions", () => {
    expect(provider.dimensions).toBe(512);
  });

  it("generates embeddings for a single text", async () => {
    const [embedding] = await provider.embed(["hello world"]);
    expect(embedding).toHaveLength(512);
  });

  it("generates embeddings for multiple texts", async () => {
    const embeddings = await provider.embed(["hello", "world", "test"]);
    expect(embeddings).toHaveLength(3);
    for (const emb of embeddings) {
      expect(emb).toHaveLength(512);
    }
  });

  it("produces normalized vectors (L2 norm ~1)", async () => {
    const [embedding] = await provider.embed(["typescript monorepo"]);
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it("produces zero vector for empty string", async () => {
    const [embedding] = await provider.embed([""]);
    const sum = embedding.reduce((s, v) => s + Math.abs(v), 0);
    expect(sum).toBe(0);
  });

  it("similar texts produce similar embeddings", async () => {
    const [a] = await provider.embed(["typescript react project"]);
    const [b] = await provider.embed(["typescript react application"]);
    const [c] = await provider.embed(["underwater basket weaving"]);

    // Cosine similarity
    const dot = (x: number[], y: number[]) =>
      x.reduce((s, v, i) => s + v * y[i], 0);

    const simAB = dot(a, b);
    const simAC = dot(a, c);

    // a and b should be more similar than a and c
    expect(simAB).toBeGreaterThan(simAC);
  });

  it("is deterministic", async () => {
    const [a] = await provider.embed(["test input"]);
    const [b] = await provider.embed(["test input"]);
    expect(a).toEqual(b);
  });
});

describe("createEmbeddingProvider", () => {
  it("creates LocalEmbeddingProvider for 'local'", () => {
    const provider = createEmbeddingProvider("local");
    expect(provider).toBeInstanceOf(LocalEmbeddingProvider);
    expect(provider.dimensions).toBe(512);
  });

  it("throws for 'anthropic' without API key", () => {
    const original = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => createEmbeddingProvider("anthropic")).toThrow(
        "ANTHROPIC_API_KEY",
      );
    } finally {
      if (original) process.env.ANTHROPIC_API_KEY = original;
    }
  });
});
