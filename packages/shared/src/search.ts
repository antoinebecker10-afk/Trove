import type { ContentItem, ContentType } from "./content-item.js";

export interface SearchOptions {
  /** Filter by content type */
  type?: ContentType;
  /** Filter by source connector */
  source?: string;
  /** Max results to return */
  limit?: number;
}

export interface SearchResult {
  item: ContentItem;
  /** Relevance score (0-1, higher is better) */
  score: number;
}

export interface IndexStats {
  totalItems: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  lastIndexedAt: string | null;
}
