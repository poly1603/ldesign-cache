/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cacheManager = require('./core/cache-manager.cjs');
var factory = require('./engines/factory.cjs');
var presets = require('./presets.cjs');
var cacheAnalyzer = require('./core/cache-analyzer.cjs');
var memoryManager = require('./core/memory-manager.cjs');
var namespaceManager = require('./core/namespace-manager.cjs');
var performanceMonitor = require('./core/performance-monitor.cjs');
var prefetchManager = require('./core/prefetch-manager.cjs');
var snapshotManager = require('./core/snapshot-manager.cjs');
var syncManager = require('./core/sync-manager.cjs');
var tagManager = require('./core/tag-manager.cjs');
var versionManager = require('./core/version-manager.cjs');
var warmupManager = require('./core/warmup-manager.cjs');
var plugin = require('./engine/plugin.cjs');
var baseEngine = require('./engines/base-engine.cjs');
var cookieEngine = require('./engines/cookie-engine.cjs');
var indexeddbEngine = require('./engines/indexeddb-engine.cjs');
var localStorageEngine = require('./engines/local-storage-engine.cjs');
var memoryEngine = require('./engines/memory-engine.cjs');
var sessionStorageEngine = require('./engines/session-storage-engine.cjs');
var aesCrypto = require('./security/aes-crypto.cjs');
var keyObfuscator = require('./security/key-obfuscator.cjs');
var securityManager = require('./security/security-manager.cjs');
var evictionStrategies = require('./strategies/eviction-strategies.cjs');
var storageStrategy = require('./strategies/storage-strategy.cjs');
var index$1 = require('./types/index.cjs');
var index$2 = require('./utils/index.cjs');
var retryManager = require('./utils/retry-manager.cjs');
var eventEmitter = require('./utils/event-emitter.cjs');
var batchHelpers = require('./utils/batch-helpers.cjs');
var compressor = require('./utils/compressor.cjs');
var errorHandler = require('./utils/error-handler.cjs');
var eventThrottle = require('./utils/event-throttle.cjs');
var minHeap = require('./utils/min-heap.cjs');
var objectPool = require('./utils/object-pool.cjs');
var performanceProfiler = require('./utils/performance-profiler.cjs');
var prefetcher = require('./utils/prefetcher.cjs');
var serializationCache = require('./utils/serialization-cache.cjs');
var validator = require('./utils/validator.cjs');

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
    ...presets.getPresetOptions(preset),
    ...rest
  };
  return new cacheManager.CacheManager(merged);
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
  CacheManager: cacheManager.CacheManager,
  createCache,
  getDefaultCache,
  cache,
  StorageEngineFactory: factory.StorageEngineFactory
};

exports.CacheManager = cacheManager.CacheManager;
exports.StorageEngineFactory = factory.StorageEngineFactory;
exports.createBrowserCache = presets.createBrowserCache;
exports.createNodeCache = presets.createNodeCache;
exports.createOfflineCache = presets.createOfflineCache;
exports.createSSRCache = presets.createSSRCache;
exports.getPresetOptions = presets.getPresetOptions;
exports.CacheAnalyzer = cacheAnalyzer.CacheAnalyzer;
exports.createCacheAnalyzer = cacheAnalyzer.createCacheAnalyzer;
exports.MemoryManager = memoryManager.MemoryManager;
exports.createMemoryManager = memoryManager.createMemoryManager;
exports.CacheNamespace = namespaceManager.CacheNamespace;
exports.createNamespace = namespaceManager.createNamespace;
exports.PerformanceMonitor = performanceMonitor.PerformanceMonitor;
exports.PrefetchManager = prefetchManager.PrefetchManager;
exports.createPrefetchManager = prefetchManager.createPrefetchManager;
exports.SnapshotManager = snapshotManager.SnapshotManager;
exports.createSnapshotManager = snapshotManager.createSnapshotManager;
exports.SyncManager = syncManager.SyncManager;
exports.TagManager = tagManager.TagManager;
exports.createTagManager = tagManager.createTagManager;
exports.VersionManager = versionManager.VersionManager;
exports.createVersionManager = versionManager.createVersionManager;
exports.WarmupManager = warmupManager.WarmupManager;
exports.createWarmupManager = warmupManager.createWarmupManager;
exports.createCacheEnginePlugin = plugin.createCacheEnginePlugin;
exports.BaseStorageEngine = baseEngine.BaseStorageEngine;
exports.CookieEngine = cookieEngine.CookieEngine;
exports.IndexedDBEngine = indexeddbEngine.IndexedDBEngine;
exports.LocalStorageEngine = localStorageEngine.LocalStorageEngine;
exports.MemoryEngine = memoryEngine.MemoryEngine;
exports.SessionStorageEngine = sessionStorageEngine.SessionStorageEngine;
exports.AESCrypto = aesCrypto.AESCrypto;
exports.KeyObfuscator = keyObfuscator.KeyObfuscator;
exports.SecurityManager = securityManager.SecurityManager;
exports.ARCStrategy = evictionStrategies.ARCStrategy;
exports.EvictionStrategyFactory = evictionStrategies.EvictionStrategyFactory;
exports.FIFOStrategy = evictionStrategies.FIFOStrategy;
exports.LFUStrategy = evictionStrategies.LFUStrategy;
exports.LRUStrategy = evictionStrategies.LRUStrategy;
exports.MRUStrategy = evictionStrategies.MRUStrategy;
exports.RandomStrategy = evictionStrategies.RandomStrategy;
exports.TTLStrategy = evictionStrategies.TTLStrategy;
exports.StorageStrategy = storageStrategy.StorageStrategy;
exports.isSerializableValue = index$1.isSerializableValue;
exports.isValidCacheEventType = index$1.isValidCacheEventType;
exports.isValidDataType = index$1.isValidDataType;
exports.isValidStorageEngine = index$1.isValidStorageEngine;
exports.clamp = index$2.clamp;
exports.deepClone = index$2.deepClone;
exports.deepMerge = index$2.deepMerge;
exports.delay = index$2.delay;
exports.formatBytes = index$2.formatBytes;
exports.formatNumber = index$2.formatNumber;
exports.formatPercentage = index$2.formatPercentage;
exports.generateId = index$2.generateId;
exports.generateUUID = index$2.generateUUID;
exports.isBrowser = index$2.isBrowser;
exports.isEmpty = index$2.isEmpty;
exports.isNode = index$2.isNode;
exports.isNonEmptyString = index$2.isNonEmptyString;
exports.isSSR = index$2.isSSR;
exports.isValidInput = index$2.isValidInput;
exports.isWebWorker = index$2.isWebWorker;
exports.once = index$2.once;
exports.randomInt = index$2.randomInt;
exports.safeJsonParse = index$2.safeJsonParse;
exports.safeJsonStringify = index$2.safeJsonStringify;
exports.withTimeout = index$2.withTimeout;
exports.CircuitBreaker = retryManager.CircuitBreaker;
exports.FallbackHandler = retryManager.FallbackHandler;
exports.RetryManager = retryManager.RetryManager;
exports.withCircuitBreaker = retryManager.withCircuitBreaker;
exports.withFallback = retryManager.withFallback;
exports.withRetry = retryManager.withRetry;
exports.EventEmitter = eventEmitter.EventEmitter;
exports.BatchHelper = batchHelpers.BatchHelper;
exports.batchGet = batchHelpers.batchGet;
exports.batchHas = batchHelpers.batchHas;
exports.batchRemove = batchHelpers.batchRemove;
exports.batchSet = batchHelpers.batchSet;
exports.createBatchHelper = batchHelpers.createBatchHelper;
exports.Compressor = compressor.Compressor;
exports.withCompression = compressor.withCompression;
exports.ErrorHandler = errorHandler.ErrorHandler;
exports.handleErrors = errorHandler.handleErrors;
exports.isErrorType = errorHandler.isErrorType;
exports.normalizeError = errorHandler.normalizeError;
exports.safeAsync = errorHandler.safeAsync;
exports.safeSync = errorHandler.safeSync;
exports.ThrottledEventEmitter = eventThrottle.ThrottledEventEmitter;
exports.createThrottledEmitter = eventThrottle.createThrottledEmitter;
exports.debounce = eventThrottle.debounce;
exports.throttle = eventThrottle.throttle;
exports.MinHeap = minHeap.MinHeap;
exports.createMinHeap = minHeap.createMinHeap;
exports.createMinHeapFromArray = minHeap.createMinHeapFromArray;
exports.ObjectPool = objectPool.ObjectPool;
exports.cacheItemPool = objectPool.cacheItemPool;
exports.metadataPool = objectPool.metadataPool;
exports.PerformanceProfiler = performanceProfiler.PerformanceProfiler;
exports.createProfiler = performanceProfiler.createProfiler;
exports.disableProfiling = performanceProfiler.disableProfiling;
exports.enableProfiling = performanceProfiler.enableProfiling;
exports.generateGlobalReport = performanceProfiler.generateGlobalReport;
exports.globalProfiler = performanceProfiler.globalProfiler;
exports.Prefetcher = prefetcher.Prefetcher;
exports.withPrefetching = prefetcher.withPrefetching;
exports.SerializationCache = serializationCache.SerializationCache;
exports.createSerializationCache = serializationCache.createSerializationCache;
exports.deserializeWithCache = serializationCache.deserializeWithCache;
exports.globalDeserializeCache = serializationCache.globalDeserializeCache;
exports.globalSerializeCache = serializationCache.globalSerializeCache;
exports.serializeWithCache = serializationCache.serializeWithCache;
exports.ValidationError = validator.ValidationError;
exports.Validator = validator.Validator;
exports.validateEngine = validator.validateEngine;
exports.validateKey = validator.validateKey;
exports.validateSetInput = validator.validateSetInput;
exports.validateSetOptions = validator.validateSetOptions;
exports.validateTTL = validator.validateTTL;
exports.validateValue = validator.validateValue;
exports.cache = cache;
exports.createCache = createCache;
exports.default = index;
exports.getDefaultCache = getDefaultCache;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=index.cjs.map
