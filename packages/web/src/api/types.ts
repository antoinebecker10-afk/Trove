import type { IncomingMessage, ServerResponse } from "node:http";
import type { TroveEngine } from "@trove/core";

export type { IncomingMessage, ServerResponse };

export interface RouteContext {
  engine: () => Promise<TroveEngine>;
  invalidateEngine: () => void;
}

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext,
) => Promise<boolean>;
