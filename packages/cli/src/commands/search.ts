import chalk from "chalk";
import { TroveEngine } from "@trove/core";
import type { ContentType } from "@trove/shared";
import { log } from "../utils/logger.js";

const TYPE_ICONS: Record<string, string> = {
  github: "⬡",
  file: "◻",
  image: "◈",
  video: "▶",
  document: "▣",
  bookmark: "◆",
};

/**
 * `trove search <query>` — search indexed content.
 */
export async function searchCommand(
  query: string,
  options?: { type?: string; limit?: number; json?: boolean },
): Promise<void> {
  try {
    const engine = await TroveEngine.create();

    // Try semantic search first, fall back to keyword
    let results = await engine.search(query, {
      type: options?.type as ContentType | undefined,
      limit: options?.limit ?? 10,
    });

    let usedKeyword = false;
    if (results.length === 0) {
      const keywordResults = await engine.keywordSearch(query, {
        type: options?.type as ContentType | undefined,
        limit: options?.limit ?? 10,
      });
      results = keywordResults.map((item) => ({ item, score: 1 }));
      usedKeyword = true;
    }

    // JSON output mode
    if (options?.json) {
      const output = results.map((r) => {
        const { embedding: _e, ...rest } = r.item;
        return { ...rest, score: r.score };
      });
      console.log(JSON.stringify(output, null, 2));
      return;
    }

    if (results.length === 0) {
      log.warn(`No results for "${query}"`);
      log.dim("Try reindexing: trove index");
      return;
    }

    console.log();
    log.dim(
      `${results.length} result${results.length > 1 ? "s" : ""} for "${query}"${usedKeyword ? " (keyword)" : ""}`,
    );
    console.log();

    for (const { item, score } of results) {
      const icon = TYPE_ICONS[item.type] ?? "·";
      const color = chalk.hex("#f97316");

      console.log(
        `  ${color(icon)} ${chalk.bold(item.title)} ${chalk.dim(`[${item.type}]`)} ${chalk.dim(`${Math.round(score * 100)}%`)}`,
      );
      console.log(`    ${chalk.dim(item.description)}`);
      if (item.tags.length > 0) {
        console.log(
          `    ${item.tags.map((t) => chalk.dim(`#${t}`)).join(" ")}`,
        );
      }
      console.log(`    ${chalk.underline.dim(item.uri)}`);
      console.log();
    }
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
