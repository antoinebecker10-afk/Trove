/**
 * Embedding providers for semantic search.
 * The local provider works without any API key (keyword-based).
 * The Anthropic provider uses the Claude API for real embeddings.
 */

export interface EmbeddingProvider {
  /** Compute embeddings for a batch of texts */
  embed(texts: string[]): Promise<number[][]>;
  /** Dimensionality of produced vectors */
  dimensions: number;
}

/**
 * Local keyword-based "embedding" using TF-IDF-like approach.
 * No API key needed. Good enough for basic search.
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 512;

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }

  private hashToken(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash * 31 + token.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % this.dimensions;
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vec = new Float64Array(this.dimensions);
      const tokens = this.tokenize(text);
      for (const token of tokens) {
        const idx = this.hashToken(token);
        vec[idx] += 1;
      }
      // L2 normalize
      let norm = 0;
      for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
      norm = Math.sqrt(norm);
      if (norm > 0) {
        for (let i = 0; i < vec.length; i++) vec[i] /= norm;
      }
      return Array.from(vec);
    });
  }
}

/**
 * Anthropic API-based embedding provider.
 * Requires ANTHROPIC_API_KEY in environment.
 */
export class AnthropicEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1024;
  private apiKey: string;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic embeddings. " +
          'Set embeddings: "local" in .trove.yml to use without an API key.',
      );
    }
    this.apiKey = key;
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Use Voyager embeddings via Anthropic API
    // For now, fall back to local if the embedding endpoint isn't available
    const response = await fetch("https://api.anthropic.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2024-10-22",
      },
      body: JSON.stringify({
        model: "voyage-3",
        input: texts,
      }),
    });

    if (!response.ok) {
      // Don't leak response body — may contain sensitive info
      await response.text().catch(() => {});
      throw new Error(`Anthropic embeddings API error (${response.status})`);
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return data.data.map((d) => d.embedding);
  }
}

/**
 * Create the appropriate embedding provider based on config.
 */
export function createEmbeddingProvider(
  provider: "anthropic" | "local",
): EmbeddingProvider {
  if (provider === "anthropic") {
    return new AnthropicEmbeddingProvider();
  }
  return new LocalEmbeddingProvider();
}
