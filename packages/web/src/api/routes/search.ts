import type { IncomingMessage, ServerResponse } from "node:http";
import type { ContentType } from "@trove/shared";
import type { RouteContext } from "../types.js";
import { json, parseQuery } from "../middleware.js";
import { askOllama } from "../ollama.js";

export async function handleSearchRoutes(
  url: string,
  method: string,
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext,
): Promise<boolean> {
  // GET /api/stats
  if (url.startsWith("/api/stats") && method === "GET") {
    const eng = await ctx.engine();
    const stats = await eng.getStats();
    json(res, stats);
    return true;
  }

  // GET /api/search?q=...&type=...
  if (url.startsWith("/api/search") && method === "GET") {
    const params = parseQuery(url);
    const q = params.get("q")?.trim();
    if (!q) {
      json(res, { results: [], aiAnswer: null });
      return true;
    }

    const type = params.get("type") ?? undefined;
    const source = params.get("source") ?? undefined;
    const eng = await ctx.engine();

    let searchResults = await eng.search(q, { type: type as ContentType | undefined, source, limit: 10 });

    if (searchResults.length === 0) {
      const kwResults = await eng.keywordSearch(q, { type: type as ContentType | undefined, source, limit: 10 });
      searchResults = kwResults.map((item) => ({ item, score: 1 }));
    }

    const results = searchResults.map(({ item, score }) => {
      const { embedding: _e, ...rest } = item;
      return { ...rest, score };
    });

    let aiAnswer: string | null = null;
    if (results.length > 0) {
      const context = results
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title} (${r.type}) — ${r.uri}\n    ${r.description}\n    tags: ${r.tags.join(", ")}${r.score != null ? `\n    relevance: ${Math.round(r.score * 100)}%` : ""}`,
        )
        .join("\n\n");

      aiAnswer = await askOllama(q, context);
    }

    json(res, { results, aiAnswer: aiAnswer || null });
    return true;
  }

  // GET /api/items?type=...&page=...&limit=...&sort=...
  if (url.startsWith("/api/items") && method === "GET") {
    const params = parseQuery(url);
    const type = params.get("type") ?? undefined;
    const source = params.get("source") ?? undefined;
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const limit = Math.min(200, Math.max(1, Number(params.get("limit") ?? 60)));
    const sort = params.get("sort") ?? "recent";
    const eng = await ctx.engine();
    const allItems = await eng.getAllItems();

    let filtered = type
      ? allItems.filter((item) => item.type === type)
      : allItems;

    if (source) {
      filtered = filtered.filter((item) => item.source === source);
    }

    if (sort === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "type") {
      filtered.sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => b.indexedAt.localeCompare(a.indexedAt));
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit).map((item) => {
      const { embedding: _e, content: _c, ...rest } = item;
      return rest;
    });

    json(res, { items: paged, total, page, pages: Math.ceil(total / limit) });
    return true;
  }

  return false;
}
