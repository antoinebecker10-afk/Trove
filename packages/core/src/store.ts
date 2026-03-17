import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ContentItem, IndexStats, SearchResult } from "@trove/shared";

/**
 * Abstract store interface — all storage backends implement this.
 */
export interface Store {
  upsertItems(items: ContentItem[]): Promise<void>;
  getAllItems(): Promise<ContentItem[]>;
  getItem(id: string): Promise<ContentItem | null>;
  search(embedding: number[], limit: number): Promise<SearchResult[]>;
  getStats(): Promise<IndexStats>;
  clear(source?: string): Promise<void>;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * JSON file-based store. Zero dependencies, works everywhere.
 */
export class JsonStore implements Store {
  private items: Map<string, ContentItem> = new Map();
  private filepath: string;
  private loaded = false;

  constructor(dataDir: string) {
    this.filepath = join(dataDir, "index.json");
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(this.filepath, "utf-8");
      const data: ContentItem[] = JSON.parse(raw);
      for (const item of data) {
        this.items.set(item.id, item);
      }
    } catch {
      // File doesn't exist yet — start empty
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    const dir = this.filepath.replace(/[/\\][^/\\]+$/, "");
    await mkdir(dir, { recursive: true });
    const data = Array.from(this.items.values());
    await writeFile(this.filepath, JSON.stringify(data, null, 2), "utf-8");
  }

  async upsertItems(items: ContentItem[]): Promise<void> {
    await this.ensureLoaded();
    for (const item of items) {
      this.items.set(item.id, item);
    }
    await this.persist();
  }

  async getAllItems(): Promise<ContentItem[]> {
    await this.ensureLoaded();
    return Array.from(this.items.values());
  }

  async getItem(id: string): Promise<ContentItem | null> {
    await this.ensureLoaded();
    return this.items.get(id) ?? null;
  }

  async search(embedding: number[], limit: number): Promise<SearchResult[]> {
    await this.ensureLoaded();
    const scored: SearchResult[] = [];

    for (const item of this.items.values()) {
      if (!item.embedding || item.embedding.length === 0) continue;
      const score = cosineSimilarity(embedding, item.embedding);
      scored.push({ item, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async getStats(): Promise<IndexStats> {
    await this.ensureLoaded();
    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let lastIndexedAt: string | null = null;

    for (const item of this.items.values()) {
      byType[item.type] = (byType[item.type] ?? 0) + 1;
      bySource[item.source] = (bySource[item.source] ?? 0) + 1;
      if (!lastIndexedAt || item.indexedAt > lastIndexedAt) {
        lastIndexedAt = item.indexedAt;
      }
    }

    return {
      totalItems: this.items.size,
      byType,
      bySource,
      lastIndexedAt,
    };
  }

  async clear(source?: string): Promise<void> {
    await this.ensureLoaded();
    if (source) {
      for (const [id, item] of this.items) {
        if (item.source === source) this.items.delete(id);
      }
    } else {
      this.items.clear();
    }
    await this.persist();
  }
}

/**
 * Create the appropriate store based on config.
 */
export function createStore(backend: "json" | "sqlite", dataDir: string): Store {
  // SQLite support can be added later as an optional upgrade
  return new JsonStore(dataDir);
}
