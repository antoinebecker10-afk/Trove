import chalk from "chalk";

export const log = {
  info: (...args: unknown[]) => console.log(chalk.cyan("►"), ...args),
  success: (...args: unknown[]) => console.log(chalk.green("✓"), ...args),
  warn: (...args: unknown[]) => console.log(chalk.yellow("⚠"), ...args),
  error: (...args: unknown[]) => console.error(chalk.red("✗"), ...args),
  dim: (...args: unknown[]) => console.log(chalk.dim(...args.map(String))),
  brand: (...args: unknown[]) =>
    console.log(chalk.hex("#f97316").bold("🦞 TROVE"), ...args),
};
