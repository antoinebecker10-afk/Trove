export { TroveEngine, type EngineOptions } from "./engine.js";
export { loadConfig, resolveDataDir, expandHome } from "./config.js";
export { createStore, JsonStore, type Store } from "./store.js";
export {
  createEmbeddingProvider,
  LocalEmbeddingProvider,
  AnthropicEmbeddingProvider,
  type EmbeddingProvider,
} from "./embeddings.js";
export { loadConnector, registerBuiltinConnector } from "./plugin-loader.js";
