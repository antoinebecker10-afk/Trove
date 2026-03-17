import type { z } from "zod";
import type { ContentItem } from "./content-item.js";

export interface ConnectorManifest {
  /** Unique connector name: "github", "local", "notion" */
  name: string;
  /** Semver version */
  version: string;
  /** One-line description */
  description: string;
  /** Zod schema for connector-specific config validation */
  configSchema: z.ZodType;
}

export interface IndexOptions {
  /** Only items modified after this date */
  since?: Date;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Progress callback */
  onProgress?: (indexed: number, total?: number) => void;
}

export interface Connector {
  manifest: ConnectorManifest;

  /** Validate connector config before indexing */
  validate(
    config: Record<string, unknown>,
  ): Promise<{ valid: boolean; errors?: string[] }>;

  /** Crawl the source and yield content items incrementally */
  index(
    config: Record<string, unknown>,
    options: IndexOptions,
  ): AsyncGenerator<ContentItem>;

  /** Optional: retrieve a single item by ID */
  getItem?(
    id: string,
    config: Record<string, unknown>,
  ): Promise<ContentItem | null>;
}
