import { copyFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import chalk from "chalk";
import { log } from "../utils/logger.js";

/**
 * `trove init` — scaffold a .trove.yml config in the current directory.
 */
export async function initCommand(options: { dir?: string }): Promise<void> {
  const dir = options.dir ?? process.cwd();

  log.brand("Initializing Trove...\n");

  const configDest = resolve(dir, ".trove.yml");
  const envDest = resolve(dir, ".env");

  // Check if config already exists
  try {
    await access(configDest);
    log.warn(`.trove.yml already exists in ${dir}`);
    log.dim("Edit it to customize your sources.\n");
    return;
  } catch {
    // File doesn't exist, proceed
  }

  // Find the example config (shipped with the package)
  const exampleConfig = join(import.meta.dirname, "../../.trove.example.yml");
  const exampleEnv = join(import.meta.dirname, "../../.env.example");

  // Try to copy from the package, fall back to generating inline
  try {
    await copyFile(exampleConfig, configDest);
  } catch {
    // Generate a minimal config inline
    const { writeFile } = await import("node:fs/promises");
    await writeFile(
      configDest,
      `# Trove configuration
storage: json
data_dir: ~/.trove
embeddings: local

sources:
  - connector: local
    config:
      paths:
        - ~/projects
      extensions: [".md", ".ts", ".js", ".py", ".rs", ".png", ".jpg", ".mp4", ".pdf"]
      ignore: ["node_modules", ".git", "dist", "target"]
      max_depth: 5

  - connector: github
    config:
      username: your-github-username
      include_forks: false
      include_archived: false
`,
      "utf-8",
    );
  }

  // Copy .env.example if .env doesn't exist
  try {
    await access(envDest);
  } catch {
    try {
      await copyFile(exampleEnv, envDest);
    } catch {
      const { writeFile } = await import("node:fs/promises");
      await writeFile(
        envDest,
        `# Trove — Environment Variables\nANTHROPIC_API_KEY=\nGITHUB_TOKEN=\n`,
        "utf-8",
      );
    }
  }

  log.success("Created .trove.yml");
  log.success("Created .env");
  console.log();
  log.info("Next steps:");
  console.log(chalk.dim("  1. Edit .trove.yml — configure your sources"));
  console.log(chalk.dim("  2. Edit .env — add your API keys (optional)"));
  console.log(chalk.hex("#f97316")("  3. Run: trove index"));
  console.log();
}
