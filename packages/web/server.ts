/**
 * Trove Web Backend — connects the dashboard to TroveEngine + Ollama.
 * Runs on port 7334 (Vite proxies /api/* here).
 *
 * Usage: npx tsx server.ts
 */

import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { TroveEngine } from "@trove/core";
import {
  PORT,
  AUTH_TOKEN,
  OLLAMA_URL,
  OLLAMA_MODEL,
  setSecurityHeaders,
  checkHost,
  handleCors,
  checkAuth,
  checkRateLimit,
  error,
} from "./src/api/middleware.js";
import { handleSearchRoutes } from "./src/api/routes/search.js";
import { handleFileRoutes } from "./src/api/routes/files.js";
import { handleSystemRoutes } from "./src/api/routes/system.js";
import { handleConnectorRoutes } from "./src/api/routes/connectors.js";
import type { RouteContext } from "./src/api/types.js";

let engine: TroveEngine | null = null;

const ctx: RouteContext = {
  engine: async () => {
    if (!engine) engine = await TroveEngine.create();
    return engine;
  },
  invalidateEngine: () => {
    engine = null;
  },
};

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";

  setSecurityHeaders(res);

  if (!checkHost(req)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (handleCors(req, res, method)) return;
  if (!checkAuth(req, res)) return;
  if (!checkRateLimit(req, res)) return;

  try {
    if (await handleSearchRoutes(url, method, req, res, ctx)) return;
    if (await handleFileRoutes(url, method, req, res, ctx)) return;
    if (await handleSystemRoutes(url, method, req, res, ctx)) return;
    if (await handleConnectorRoutes(url, method, req, res, ctx)) return;
    error(res, "Not found", 404);
  } catch (err) {
    console.error("[trove-api]", err);
    error(res, "Internal error");
  }
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error("[trove-api] unhandled:", err);
    error(res, "Internal error");
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Trove API running on http://127.0.0.1:${PORT}`);
  console.log(`   Auth token: ${AUTH_TOKEN}`);
  console.log(`   Ollama: ${OLLAMA_URL} (model: ${OLLAMA_MODEL})`);
});
