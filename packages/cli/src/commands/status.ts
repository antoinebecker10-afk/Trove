import chalk from "chalk";
import { TroveEngine } from "@trove/core";
import { log } from "../utils/logger.js";

/**
 * `trove status` — show index statistics.
 */
export async function statusCommand(): Promise<void> {
  try {
    const engine = await TroveEngine.create();
    const stats = await engine.getStats();
    const config = engine.getConfig();

    log.brand("Status\n");

    console.log(
      chalk.dim("  Storage:    ") + config.storage,
    );
    console.log(
      chalk.dim("  Embeddings: ") + config.embeddings,
    );
    console.log(
      chalk.dim("  Data dir:   ") + config.data_dir,
    );
    console.log(
      chalk.dim("  Last index: ") +
        (stats.lastIndexedAt ?? "never"),
    );
    console.log();

    console.log(
      chalk.hex("#f97316").bold(`  ${stats.totalItems} items indexed`),
    );
    console.log();

    if (Object.keys(stats.byType).length > 0) {
      console.log(chalk.dim("  By type:"));
      for (const [type, count] of Object.entries(stats.byType)) {
        console.log(chalk.dim(`    ${type}: ${count}`));
      }
      console.log();
    }

    if (Object.keys(stats.bySource).length > 0) {
      console.log(chalk.dim("  By source:"));
      for (const [source, count] of Object.entries(stats.bySource)) {
        console.log(chalk.dim(`    ${source}: ${count}`));
      }
      console.log();
    }

    console.log(chalk.dim(`  Sources configured: ${config.sources.length}`));
    for (const s of config.sources) {
      console.log(chalk.dim(`    - ${s.connector}`));
    }
    console.log();
  } catch (err) {
    log.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}
