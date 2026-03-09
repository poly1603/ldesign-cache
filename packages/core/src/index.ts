/**
 * @ldesign/cache-core
 */

export type {
  BatchFailure,
  BatchOptions,
  BatchResult,
  BatchSetEntry,
  CacheError,
  CacheItem,
  CacheItemMetadata,
  CacheOptions,
  CachePlugin,
  CachePluginContext,
  CachePluginSetInput,
  CacheQueryClientLike,
  CacheQueryOptions,
  CacheQueryResult,
  CacheStats,
  CacheableValue,
  EvictionReason,
  ICacheStrategy,
  InvalidatePredicate,
  ReadonlyCacheItem,
  Serializer,
  SetOptions,
  StorageType,
  PerformanceMetrics,
} from './types'

export {
  CacheErrorCode,
  CacheEventType,
  CacheStrategy,
} from './types'

export { CacheManager, createCacheManager } from './cache-manager'
export { CacheQueryClient, createCacheQueryClient } from './query'

export { FIFOCache } from './strategies/fifo'
export { LFUCache } from './strategies/lfu'
export { LRUCache } from './strategies/lru'
export { TTLCache } from './strategies/ttl'

export {
  Base64Serializer,
  createBase64Serializer,
  createJSONSerializer,
  JSONSerializer,
} from './serializers'

export type { IndexedDBAdapterOptions, IStorageAdapter } from './storage'
export {
  BaseStorageAdapter,
  createIndexedDBAdapter,
  IndexedDBStorageAdapter,
  LocalStorageAdapter,
  MemoryStorageAdapter,
  SessionStorageAdapter,
} from './storage'

export {
  createLoggerPlugin,
  LoggerPlugin,
  createPerformancePlugin,
  PerformancePlugin,
} from './plugins'

export type {
  LogLevel,
  LoggerPluginOptions,
  OperationStats,
  PerformanceMetric,
  PerformancePluginOptions,
  PerformanceStats,
} from './plugins'

export {
  debounce,
  createKeyedDebounce,
  createKeyedThrottle,
  delay,
  estimateCacheItemSize,
  estimateMemoryUsage,
  formatBytes,
  generateCacheKey,
  generateId,
  hashString,
  isExpired,
  isIndexedDBAvailable,
  isStorageAvailable,
  measureTime,
  MemoryTracker,
  parseCacheKey,
  throttle,
  TimerManager,
  validateKey,
  validateMaxSize,
  validateTTL,
  validateValue,
} from './utils'

export type {
  DebouncedFunction,
  DebounceOptions,
  MemoryTrackerSummary,
  ThrottledFunction,
  ThrottleOptions,
} from './utils'

export {
  DEFAULT_CONFIG,
  ERROR_MESSAGES,
  PERFORMANCE,
  STORAGE,
  VERSION,
} from './constants'

export * from './engine'

export { createCacheManager as default } from './cache-manager'
