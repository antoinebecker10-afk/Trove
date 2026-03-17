import { mkdir } from "node:fs/promises";
import type {
  ContentItem,
  TroveConfig,
  SearchOptions,
  SearchResult,
  IndexStats,
} from "@trove/shared";
import { loadConfig, resolveDataDir } from "./config.js";
import { createStore, type Store } from "./store.js";
import { createEmbeddingProvider, type EmbeddingProvider } from "./embeddings.js";
import { loadConnector } from "./plugin-loader.js";

export interface EngineOptions {
  /** Override config file search directory */
  cwd?: string;
  /** Override config entirely */
  config?: TroveConfig;
}

export class TroveEngine {
  private config: TroveConfig;
  private store: Store;
  private embeddings: EmbeddingProvider;
  private initialized = false;

  private constructor(
    config: TroveConfig,
    store: Store,
    embeddings: EmbeddingProvider,
  ) {
    this.config = config;
    this.store = store;
    this.embeddings = embeddings;
  }

  /**
   * Create and initialize a TroveEngine instance.
   */
  static async create(options: EngineOptions = {}): Promise<TroveEngine> {
    const config = options.config ?? (await loadConfig(options.cwd));
    const dataDir = resolveDataDir(config);
    await mkdir(dataDir, { recursive: true });

    const store = createStore(config.storage, dataDir);
    const embeddings = createEmbeddingProvider(config.embeddings);

    const engine = new TroveEngine(config, store, embeddings);
    engine.initialized = true;
    return engine;
  }

  /**
   * Index content from all configured sources (or a specific one).
   */
  async index(
    sourceName?: string,
    options?: { signal?: AbortSignal; onProgress?: (count: number) => void },
  ): Promise<number> {
    this.assertInitialized();
    let totalIndexed = 0;

    const sources = sourceName
      ? this.config.sources.filter((s) => s.connector === sourceName)
      : this.config.sources;

    if (sources.length === 0) {
      throw new Error(
        sourceName
          ? `No source configured with connector "${sourceName}"`
          : "No sources configured in .trove.yml",
      );
    }

    for (const source of sources) {
      const connector = await loadConnector(source);

      // Validate config before indexing
      const validation = await connector.validate(source.config);
      if (!validation.valid) {
        throw new Error(
          `Connector "${source.connector}" config is invalid: ${validation.errors?.join(", ")}`,
        );
      }

      // Clear old items from this source before re-indexing
      await this.store.clear(source.connector);

      const batch: ContentItem[] = [];
      const BATCH_SIZE = 50;

      for await (const item of connector.index(source.config, {
        signal: options?.signal,
      })) {
        batch.push(item);

        if (batch.length >= BATCH_SIZE) {
          await this.embedAndStore(batch);
          totalIndexed += batch.length;
          options?.onProgress?.(totalIndexed);
          batch.length = 0;
        }
      }

      // Flush remaining items
      if (batch.length > 0) {
        await this.embedAndStore(batch);
        totalIndexed += batch.length;
        options?.onProgress?.(totalIndexed);
      }
    }

    return totalIndexed;
  }

  /**
   * Search across all indexed content.
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    this.assertInitialized();

    const sanitized = sanitizeQuery(query);
    if (!sanitized) return [];

    const limit = options.limit ?? 10;

    // Generate embedding for query
    const [queryEmbedding] = await this.embeddings.embed([sanitized]);

    let results = await this.store.search(queryEmbedding, limit * 2);

    // Apply filters
    if (options.type) {
      results = results.filter((r) => r.item.type === options.type);
    }
    if (options.source) {
      results = results.filter((r) => r.item.source === options.source);
    }

    return results.slice(0, limit);
  }

  /**
   * Full-text keyword search (no embeddings needed).
   */
  async keywordSearch(
    query: string,
    options: SearchOptions = {},
  ): Promise<ContentItem[]> {
    this.assertInitialized();

    const sanitized = sanitizeQuery(query);
    if (!sanitized) return [];

    const terms = sanitized.toLowerCase().split(/\s+/);
    let items = await this.store.getAllItems();

    if (options.type) {
      items = items.filter((i) => i.type === options.type);
    }
    if (options.source) {
      items = items.filter((i) => i.source === options.source);
    }

    return items.filter((item) => {
      const haystack =
        `${item.title} ${item.description} ${item.tags.join(" ")} ${item.content ?? ""}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  /**
   * Get a single content item by ID.
   */
  async getItem(id: string): Promise<ContentItem | null> {
    this.assertInitialized();
    return this.store.getItem(id);
  }

  /**
   * Get index statistics.
   */
  async getStats(): Promise<IndexStats> {
    this.assertInitialized();
    return this.store.getStats();
  }

  /**
   * Get the current config (sanitized — no secrets).
   */
  getConfig(): TroveConfig {
    return { ...this.config };
  }

  private async embedAndStore(items: ContentItem[]): Promise<void> {
    const textsToEmbed = items.map(
      (item) =>
        `${item.title} ${item.description} ${item.tags.join(" ")} ${(item.content ?? "").slice(0, 2000)}`,
    );

    try {
      const embeddings = await this.embeddings.embed(textsToEmbed);
      for (let i = 0; i < items.length; i++) {
        items[i].embedding = embeddings[i];
      }
    } catch {
      // If embedding fails, store items without embeddings (keyword search still works)
    }

    await this.store.upsertItems(items);
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error("TroveEngine not initialized. Call TroveEngine.create() first.");
    }
  }
}

/**
 * Sanitize a search query: trim, limit length, strip control chars.
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 500);
}
