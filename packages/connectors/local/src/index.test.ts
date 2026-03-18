import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ContentItem } from "@trove/shared";

// Mock fs before importing connector
vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
  realpath: vi.fn(),
}));

import { readdir, stat, readFile, realpath } from "node:fs/promises";
import connector from "./index.js";

// Helper to collect async generator results
async function collect<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of gen) {
    results.push(item);
  }
  return results;
}

describe("local connector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("manifest", () => {
    it("has correct name and version", () => {
      expect(connector.manifest.name).toBe("local");
      expect(connector.manifest.version).toBe("0.1.0");
    });
  });

  describe("validate", () => {
    it("accepts valid config", async () => {
      const result = await connector.validate({
        paths: ["/home/user/projects"],
      });
      expect(result.valid).toBe(true);
    });

    it("rejects config without paths", async () => {
      const result = await connector.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("rejects empty paths array", async () => {
      const result = await connector.validate({ paths: [] });
      expect(result.valid).toBe(false);
    });

    it("accepts config with custom extensions", async () => {
      const result = await connector.validate({
        paths: ["/home"],
        extensions: [".rs", ".toml"],
      });
      expect(result.valid).toBe(true);
    });

    it("rejects max_depth out of range", async () => {
      const result = await connector.validate({
        paths: ["/home"],
        max_depth: 0,
      });
      expect(result.valid).toBe(false);

      const result2 = await connector.validate({
        paths: ["/home"],
        max_depth: 21,
      });
      expect(result2.valid).toBe(false);
    });
  });

  describe("index", () => {
    it("indexes files from a directory", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "app.ts", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 100,
        mtime: new Date("2025-01-01"),
      } as any);
      vi.mocked(readFile).mockResolvedValue("const x = 1;");

      const items = await collect(
        connector.index(
          { paths: ["/home/user/project"] },
          {},
        ),
      );

      expect(items).toHaveLength(1);
      expect(items[0].type).toBe("file");
      expect(items[0].title).toBe("app.ts");
      expect(items[0].source).toBe("local");
      expect(items[0].content).toBe("const x = 1;");
    });

    it("skips dotfiles", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: ".hidden", isDirectory: () => false, isFile: () => true },
        { name: "visible.ts", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 100,
        mtime: new Date("2025-01-01"),
      } as any);
      vi.mocked(readFile).mockResolvedValue("");

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].title).toBe("visible.ts");
    });

    it("skips ignored directories", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "node_modules", isDirectory: () => true, isFile: () => false },
        { name: "src", isDirectory: () => true, isFile: () => false },
      ] as any);

      // Only 'src' should be walked, not 'node_modules'
      // Return empty for src
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: "node_modules", isDirectory: () => true, isFile: () => false },
        { name: "src", isDirectory: () => true, isFile: () => false },
      ] as any);
      vi.mocked(readdir).mockResolvedValueOnce([] as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(0);
      // readdir should be called for root + src, NOT for node_modules
      expect(readdir).toHaveBeenCalledTimes(2);
    });

    it("skips files with unsupported extensions", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "data.exe", isDirectory: () => false, isFile: () => true },
      ] as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(0);
    });

    it("detects image files", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "screenshot.png", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 50000,
        mtime: new Date("2025-01-01"),
      } as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].type).toBe("image");
    });

    it("detects video files", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "demo.mp4", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 5000000,
        mtime: new Date("2025-01-01"),
      } as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].type).toBe("video");
    });

    it("detects document files", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "report.pdf", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 100000,
        mtime: new Date("2025-01-01"),
      } as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].type).toBe("document");
    });

    it("respects path traversal protection", async () => {
      // realpath returns a path outside allowed roots
      vi.mocked(realpath)
        .mockResolvedValueOnce("/home/user/project") // root resolution
        .mockResolvedValue("/etc/passwd"); // symlink escapes

      vi.mocked(readdir).mockResolvedValue([
        { name: "evil-link.ts", isDirectory: () => false, isFile: () => true },
      ] as any);

      const items = await collect(
        connector.index({ paths: ["/home/user/project"] }, {}),
      );

      // The evil symlink should be filtered out
      expect(items).toHaveLength(0);
    });

    it("skips non-existent paths gracefully", async () => {
      vi.mocked(realpath).mockRejectedValue(new Error("ENOENT"));

      const items = await collect(
        connector.index({ paths: ["/nonexistent"] }, {}),
      );

      expect(items).toHaveLength(0);
    });

    it("does not read content for large files", async () => {
      vi.mocked(realpath).mockImplementation(async (p) => String(p));
      vi.mocked(readdir).mockResolvedValue([
        { name: "big.ts", isDirectory: () => false, isFile: () => true },
      ] as any);
      vi.mocked(stat).mockResolvedValue({
        size: 600_000, // > 512_000 limit
        mtime: new Date("2025-01-01"),
      } as any);

      const items = await collect(
        connector.index({ paths: ["/home"] }, {}),
      );

      expect(items).toHaveLength(1);
      expect(items[0].content).toBeUndefined();
      expect(readFile).not.toHaveBeenCalled();
    });
  });
});
