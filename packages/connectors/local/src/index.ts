import { readdir, stat, readFile, realpath } from "node:fs/promises";
import { join, extname, basename, resolve } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";
import type { Connector, ContentItem, ContentType, IndexOptions } from "@trove/shared";

const LocalConfigSchema = z.object({
  paths: z.array(z.string()).min(1),
  extensions: z
    .array(z.string())
    .default([".md", ".ts", ".js", ".py", ".rs", ".go", ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".webm", ".pdf", ".bpmn"]),
  ignore: z
    .array(z.string())
    .default(["node_modules", ".git", "dist", "target", "__pycache__", ".next", "build"]),
  max_depth: z.number().min(1).max(20).default(5),
});

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv"]);
const DOC_EXTS = new Set([".pdf", ".docx", ".xlsx", ".pptx"]);

function inferType(ext: string): ContentType {
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (DOC_EXTS.has(ext)) return "document";
  return "file";
}

function expandHome(filepath: string): string {
  if (filepath.startsWith("~/") || filepath === "~") {
    return resolve(homedir(), filepath.slice(2));
  }
  return resolve(filepath);
}

/**
 * Validate that a resolved path is under one of the allowed roots.
 * Prevents path traversal attacks.
 */
async function isPathSafe(filepath: string, allowedRoots: string[]): Promise<boolean> {
  try {
    const real = await realpath(filepath);
    return allowedRoots.some((root) => real.startsWith(root));
  } catch {
    return false;
  }
}

const connector: Connector = {
  manifest: {
    name: "local",
    version: "0.1.0",
    description: "Index local filesystem files (code, images, videos, documents)",
    configSchema: LocalConfigSchema,
  },

  async validate(config) {
    const result = LocalConfigSchema.safeParse(config);
    if (!result.success) {
      return {
        valid: false,
        errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      };
    }
    return { valid: true };
  },

  async *index(config: Record<string, unknown>, options: IndexOptions) {
    const parsed = LocalConfigSchema.parse(config);
    const allowedRoots: string[] = [];

    for (const p of parsed.paths) {
      const expanded = expandHome(p);
      try {
        allowedRoots.push(await realpath(expanded));
      } catch {
        // Path doesn't exist, skip
        continue;
      }
    }

    const ignoreSet = new Set(parsed.ignore);
    const extSet = new Set(parsed.extensions);

    async function* walk(
      dir: string,
      depth: number,
    ): AsyncGenerator<ContentItem> {
      if (depth > parsed.max_depth) return;
      if (options.signal?.aborted) return;

      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return; // Permission denied or inaccessible
      }

      for (const entry of entries) {
        if (options.signal?.aborted) return;
        if (ignoreSet.has(entry.name)) continue;
        if (entry.name.startsWith(".")) continue;

        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          yield* walk(fullPath, depth + 1);
          continue;
        }

        if (!entry.isFile()) continue;

        const ext = extname(entry.name).toLowerCase();
        if (!extSet.has(ext)) continue;

        // Security: validate the resolved path is under an allowed root
        if (!(await isPathSafe(fullPath, allowedRoots))) continue;

        let fileStat;
        try {
          fileStat = await stat(fullPath);
        } catch {
          continue;
        }

        const type = inferType(ext);
        let content: string | undefined;

        // Read text content for searchability (skip binary/large files)
        if (type === "file" && fileStat.size < 512_000) {
          try {
            content = await readFile(fullPath, "utf-8");
          } catch {
            // Binary file or encoding issue
          }
        }

        const item: ContentItem = {
          id: `local:${fullPath}`,
          source: "local",
          type,
          title: basename(fullPath),
          description: `${type} in ${dir}`,
          tags: [ext.slice(1), ...dir.split(/[/\\]/).slice(-2)],
          uri: fullPath,
          metadata: {
            size: fileStat.size,
            modified: fileStat.mtime.toISOString(),
            extension: ext,
          },
          indexedAt: new Date().toISOString(),
          content,
        };

        yield item;
      }
    }

    for (const root of allowedRoots) {
      yield* walk(root, 0);
    }
  },
};

export default connector;
