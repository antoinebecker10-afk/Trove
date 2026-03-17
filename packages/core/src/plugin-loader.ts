import type { Connector, SourceConfig } from "@trove/shared";

/** Built-in connector registry */
const BUILTIN_CONNECTORS: Record<string, () => Promise<Connector>> = {};

/**
 * Register a built-in connector.
 * Called by connector packages at import time.
 */
export function registerBuiltinConnector(
  name: string,
  loader: () => Promise<Connector>,
): void {
  BUILTIN_CONNECTORS[name] = loader;
}

/**
 * Load a connector by name.
 *
 * Resolution order:
 * 1. Built-in connectors (registered via registerBuiltinConnector)
 * 2. Scoped npm package: @trove/connector-{name}
 * 3. Community npm package: trove-connector-{name}
 * 4. Absolute/relative path (for local development)
 */
export async function loadConnector(source: SourceConfig): Promise<Connector> {
  const name = source.connector;

  // 1. Built-in
  if (BUILTIN_CONNECTORS[name]) {
    return BUILTIN_CONNECTORS[name]();
  }

  // 2-4. Dynamic import with fallback chain
  const candidates = [
    `@trove/connector-${name}`,
    `trove-connector-${name}`,
    name, // absolute/relative path
  ];

  for (const candidate of candidates) {
    try {
      const mod = await import(candidate);
      const connector: Connector = mod.default ?? mod;
      if (!connector.manifest || !connector.index) {
        throw new Error(
          `Module "${candidate}" does not export a valid Connector interface`,
        );
      }
      return connector;
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `Connector "${name}" not found. Install it with: pnpm add @trove/connector-${name}`,
  );
}
