import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import connector from "./index.js";

// Helper to collect async generator results
async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of gen) {
    results.push(item);
  }
  return results;
}

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: "my-repo",
    full_name: "testuser/my-repo",
    description: "A test repository",
    html_url: "https://github.com/testuser/my-repo",
    stargazers_count: 10,
    language: "TypeScript",
    topics: ["cli", "tool"],
    fork: false,
    archived: false,
    pushed_at: "2025-01-01T00:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
    default_branch: "main",
    ...overrides,
  };
}

describe("github connector", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("manifest", () => {
    it("has correct name and version", () => {
      expect(connector.manifest.name).toBe("github");
      expect(connector.manifest.version).toBe("0.1.0");
    });
  });

  describe("validate", () => {
    it("accepts valid config", async () => {
      const result = await connector.validate({ username: "testuser" });
      expect(result.valid).toBe(true);
    });

    it("rejects config without username", async () => {
      const result = await connector.validate({});
      expect(result.valid).toBe(false);
    });

    it("rejects empty username", async () => {
      const result = await connector.validate({ username: "" });
      expect(result.valid).toBe(false);
    });
  });

  describe("index", () => {
    it("indexes repos from GitHub API", async () => {
      globalThis.fetch = vi.fn()
        // First call: repos endpoint
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [makeRepo()],
          headers: new Headers(),
        } as Response)
        // Second call: README
        .mockResolvedValueOnce({
          ok: true,
          text: async () => "# My Repo\nA cool project",
        } as Response);

      const items = await collect(
        connector.index({ username: "testuser" }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe("github:testuser/my-repo");
      expect(items[0].source).toBe("github");
      expect(items[0].type).toBe("github");
      expect(items[0].title).toBe("my-repo");
      expect(items[0].tags).toContain("typescript");
      expect(items[0].tags).toContain("cli");
      expect(items[0].content).toBe("# My Repo\nA cool project");
      expect(items[0].metadata).toMatchObject({ stars: 10, language: "TypeScript" });
    });

    it("skips forks when include_forks is false", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            makeRepo({ name: "original", full_name: "testuser/original", fork: false }),
            makeRepo({ name: "forked", full_name: "testuser/forked", fork: true }),
          ],
          headers: new Headers(),
        } as Response)
        // README calls
        .mockResolvedValue({ ok: false } as Response);

      const items = await collect(
        connector.index({ username: "testuser", include_forks: false }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("original");
    });

    it("includes forks when include_forks is true", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            makeRepo({ name: "original", full_name: "testuser/original", fork: false }),
            makeRepo({ name: "forked", full_name: "testuser/forked", fork: true }),
          ],
          headers: new Headers(),
        } as Response)
        .mockResolvedValue({ ok: false } as Response);

      const items = await collect(
        connector.index({ username: "testuser", include_forks: true }, {}),
      );

      expect(items).toHaveLength(2);
    });

    it("skips archived repos by default", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            makeRepo({ name: "active", full_name: "testuser/active", archived: false }),
            makeRepo({ name: "old", full_name: "testuser/old", archived: true }),
          ],
          headers: new Headers(),
        } as Response)
        .mockResolvedValue({ ok: false } as Response);

      const items = await collect(
        connector.index({ username: "testuser" }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("active");
    });

    it("handles API rate limiting (403)", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "rate limit exceeded",
      } as Response);

      await expect(
        collect(connector.index({ username: "testuser" }, {})),
      ).rejects.toThrow("rate limit");
    });

    it("handles pagination via Link header", async () => {
      globalThis.fetch = vi.fn()
        // Page 1
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [makeRepo({ name: "repo1", full_name: "testuser/repo1" })],
          headers: new Headers({
            Link: '<https://api.github.com/users/testuser/repos?page=2>; rel="next"',
          }),
        } as Response)
        // Page 2
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [makeRepo({ name: "repo2", full_name: "testuser/repo2" })],
          headers: new Headers(),
        } as Response)
        // README calls
        .mockResolvedValue({ ok: false } as Response);

      const items = await collect(
        connector.index({ username: "testuser" }, {}),
      );

      expect(items).toHaveLength(2);
    });

    it("uses description fallback when null", async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [makeRepo({ description: null })],
          headers: new Headers(),
        } as Response)
        .mockResolvedValue({ ok: false } as Response);

      const items = await collect(
        connector.index({ username: "testuser" }, {}),
      );

      expect(items[0].description).toContain("GitHub repository");
    });
  });
});
