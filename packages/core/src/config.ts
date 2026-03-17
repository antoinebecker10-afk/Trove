import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml } from "yaml";
import { TroveConfigSchema, type TroveConfig } from "@trove/shared";

const CONFIG_FILENAMES = [".trove.yml", ".trove.yaml", "trove.yml", "trove.yaml"];

/**
 * Resolve `~` to the user's home directory.
 */
export function expandHome(filepath: string): string {
  if (filepath.startsWith("~/") || filepath === "~") {
    return resolve(homedir(), filepath.slice(2));
  }
  return resolve(filepath);
}

/**
 * Locate and load the Trove config file.
 * Searches the given directory for known config filenames.
 */
export async function loadConfig(cwd?: string): Promise<TroveConfig> {
  const dir = cwd ?? process.cwd();

  for (const name of CONFIG_FILENAMES) {
    const filepath = resolve(dir, name);
    try {
      const raw = await readFile(filepath, "utf-8");
      const parsed = parseYaml(raw);
      return TroveConfigSchema.parse(parsed);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ENOENT") continue;
      throw new Error(`Failed to parse config at ${filepath}: ${err}`);
    }
  }

  // No config file found — return defaults
  return TroveConfigSchema.parse({});
}

/**
 * Resolve the data directory path (expand ~ and ensure absolute).
 */
export function resolveDataDir(config: TroveConfig): string {
  return expandHome(config.data_dir);
}
