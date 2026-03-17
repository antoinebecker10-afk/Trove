/** API client — talks to the Trove backend. No secrets exposed to browser. */

export interface ApiContentItem {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string;
  tags: string[];
  uri: string;
  metadata: Record<string, unknown>;
  indexedAt: string;
  score?: number;
}

export interface ApiStats {
  totalItems: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  lastIndexedAt: string | null;
}

export interface AiAnswer {
  text: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "Unknown error");
    throw new Error(`API error (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  stats: () => fetchJson<ApiStats>("/api/stats"),

  search: (query: string, type?: string) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.set("type", type);
    return fetchJson<{ results: ApiContentItem[]; aiAnswer?: string }>(
      `/api/search?${params}`,
    );
  },

  reindex: () =>
    fetchJson<{ count: number }>("/api/reindex", { method: "POST" }),
};
