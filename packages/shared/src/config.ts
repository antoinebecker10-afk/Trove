import { z } from "zod";

export const SourceConfigSchema = z.object({
  /** Connector package name or path */
  connector: z.string(),
  /** Connector-specific configuration */
  config: z.record(z.unknown()).default({}),
});

export type SourceConfig = z.infer<typeof SourceConfigSchema>;

export const TroveConfigSchema = z.object({
  /** Storage backend */
  storage: z.enum(["json", "sqlite"]).default("json"),
  /** Directory for index data */
  data_dir: z.string().default("~/.trove"),
  /** Embedding provider */
  embeddings: z.enum(["anthropic", "local"]).default("local"),
  /** Content sources */
  sources: z.array(SourceConfigSchema).default([]),
});

export type TroveConfig = z.infer<typeof TroveConfigSchema>;
