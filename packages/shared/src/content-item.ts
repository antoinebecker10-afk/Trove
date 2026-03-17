import { z } from "zod";

export const ContentTypeEnum = z.enum([
  "github",
  "file",
  "image",
  "video",
  "document",
  "bookmark",
]);
export type ContentType = z.infer<typeof ContentTypeEnum>;

export const ContentItemSchema = z.object({
  /** Deterministic ID: `${source}:${unique-key}` */
  id: z.string(),
  /** Connector that produced this item */
  source: z.string(),
  /** Content category */
  type: ContentTypeEnum,
  /** Human-readable title */
  title: z.string(),
  /** Short description */
  description: z.string(),
  /** Searchable tags */
  tags: z.array(z.string()),
  /** Original location (URL, file path) */
  uri: z.string(),
  /** Connector-specific metadata (stars, lang, size, etc.) */
  metadata: z.record(z.unknown()),
  /** ISO timestamp of last indexing */
  indexedAt: z.string(),
  /** Extracted text for search (optional, can be large) */
  content: z.string().optional(),
  /** Computed embedding vector (populated by engine) */
  embedding: z.array(z.number()).optional(),
});

export type ContentItem = z.infer<typeof ContentItemSchema>;
