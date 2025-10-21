/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { CacheManager } from './core/cache-manager.js';
import { StorageEngineFactory } from './engines/factory.js';
import { getPresetOptions } from './presets.js';
export { createBrowserCache, createNodeCache, createOfflineCache, createSSRCache } from './presets.js';
export { CacheAnalyzer, createCacheAnalyzer } from './core/cache-analyzer.js';
export { MemoryManager, createMemoryManager } from './core/memory-manager.js';
export { CacheNamespace, createNamespace } from './core/namespace-manager.js';
export { PerformanceMonitor } from './core/performance-monitor.js';
export { PrefetchManager, createPrefetchManager } from './core/prefetch-manager.js';
export { SnapshotManager, createSnapshotManager } from './core/snapshot-manager.js';
export { SyncManager } from './core/sync-manager.js';
export { TagManager, createTagManager } from './core/tag-manager.js';
export { VersionManager, createVersionManager } from './core/version-manager.js';
export { WarmupManager, createWarmupManager } from './core/warmup-manager.js';
export { createCacheEnginePlugin } from './engine/plugin.js';
export { BaseStorageEngine } from './engines/base-engine.js';
export { CookieEngine } from './engines/cookie-engine.js';
export { IndexedDBEngine } from './engines/indexeddb-engine.js';
export { LocalStorageEngine } from './engines/local-storage-engine.js';
export { MemoryEngine } from './engines/memory-engine.js';
export { SessionStorageEngine } from './engines/session-storage-engine.js';
export { AESCrypto } from './security/aes-crypto.js';
export { KeyObfuscator } from './security/key-obfuscator.js';
export { SecurityManager } from './security/security-manager.js';
export { ARCStrategy, EvictionStrategyFactory, FIFOStrategy, LFUStrategy, LRUStrategy, MRUStrategy, RandomStrategy, TTLStrategy } from './strategies/eviction-strategies.js';
export { StorageStrategy } from './strategies/storage-strategy.js';
export { isSerializableValue, isValidCacheEventType, isValidDataType, isValidStorageEngine } from './types/index.js';
export { clamp, deepClone, deepMerge, delay, formatBytes, formatNumber, formatPercentage, generateId, generateUUID, isBrowser, isEmpty, isNode, isNonEmptyString, isSSR, isValidInput, isWebWorker, once, randomInt, safeJsonParse, safeJsonStringify, withTimeout } from './utils/index.js';
export { CircuitBreaker, FallbackHandler, RetryManager, withCircuitBreaker, withFallback, withRetry } from './utils/retry-manager.js';
export { EventEmitter } from './utils/event-emitter.js';
export { BatchHelper, batchGet, batchHas, batchRemove, batchSet, createBatchHelper } from './utils/batch-helpers.js';
export { Compressor, withCompression } from './utils/compressor.js';
export { ErrorHandler, handleErrors, isErrorType, normalizeError, safeAsync, safeSync } from './utils/error-handler.js';
export { ThrottledEventEmitter, createThrottledEmitter, debounce, throttle } from './utils/event-throttle.js';
export { MinHeap, createMinHeap, createMinHeapFromArray } from './utils/min-heap.js';
export { ObjectPool, cacheItemPool, metadataPool } from './utils/object-pool.js';
export { PerformanceProfiler, createProfiler, disableProfiling, enableProfiling, generateGlobalReport, globalProfiler } from './utils/performance-profiler.js';
export { Prefetcher, withPrefetching } from './utils/prefetcher.js';
export { SerializationCache, createSerializationCache, deserializeWithCache, globalDeserializeCache, globalSerializeCache, serializeWithCache } from './utils/serialization-cache.js';
export { ValidationError, Validator, validateEngine, validateKey, validateSetInput, validateSetOptions, validateTTL, validateValue } from './utils/validator.js';

function detectPreset() {
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return "browser";
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.process !== "undefined" && globalThis.process?.versions?.node) {
    return "node";
  }
  return "ssr";
}
function createCache(options) {
  const preset = options?.preset ?? detectPreset();
  const {
    preset: _preset,
    ...rest
  } = options || {};
  const merged = {
    ...getPresetOptions(preset),
    ...rest
  };
  return new CacheManager(merged);
}
let _defaultCache = null;
function getDefaultCache(options) {
  if (!_defaultCache) {
    _defaultCache = createCache(options);
  }
  return _defaultCache;
}
const cache = {
  /**
   * 获取缓存值
   * @param key - 缓存键
   * @returns 缓存值或 null
   */
  async get(key) {
    return getDefaultCache().get(key);
  },
  /**
   * 设置缓存值
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   */
  async set(key, value, options) {
    return getDefaultCache().set(key, value, options);
  },
  /**
   * 删除指定键的缓存
   * @param key - 缓存键
   */
  async remove(key) {
    return getDefaultCache().remove(key);
  },
  /**
   * 清空缓存
   * @param engine - 可选，指定要清空的存储引擎
   */
  async clear(engine) {
    return getDefaultCache().clear(engine);
  },
  /**
   * 检查键是否存在
   * @param key - 缓存键
   * @returns 是否存在
   */
  async has(key) {
    return getDefaultCache().has(key);
  },
  /**
   * 获取所有键名
   * @param engine - 可选，指定存储引擎
   * @returns 键名数组
   */
  async keys(engine) {
    return getDefaultCache().keys(engine);
  },
  /**
   * 获取缓存统计信息
   * @returns 统计信息
   */
  async getStats() {
    return getDefaultCache().getStats();
  },
  /**
   * 记忆函数：如果缓存不存在则执行 fetcher 并缓存结果
   * @param key - 缓存键
   * @param fetcher - 数据获取函数
   * @param options - 设置选项
   * @returns 缓存值
   */
  async remember(key, fetcher, options) {
    return getDefaultCache().remember(key, fetcher, options);
  },
  /**
   * 获取底层缓存管理器实例
   * @returns 缓存管理器实例
   */
  manager() {
    return getDefaultCache();
  }
};
var index = {
  CacheManager,
  createCache,
  getDefaultCache,
  cache,
  StorageEngineFactory
};

export { CacheManager, StorageEngineFactory, cache, createCache, index as default, getDefaultCache, getPresetOptions };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index.js.map
