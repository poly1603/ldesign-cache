/**
 * @ldesign/cache/core - 核心缓存管理库
 * 
 * 企业级缓存管理解决方案，支持多种缓存策略
 * 
 * @module @ldesign/cache/core
 */

// ============================================================
// 类型定义
// ============================================================
export type {
  // 核心类型
  CacheItem,
  CacheItemMetadata,
  CacheOptions,
  CacheStats,
  ReadonlyCacheItem,
  CacheableValue,
  StorageType,
  SetOptions,
  CachePluginContext,
  // 事件类型
  CacheEvent,
  CacheEventListener,
  // 批量操作类型
  BatchOptions,
  BatchResult,
  BatchFailure,
  BatchSetEntry,
  // 接口类型
  Serializer,
  CachePlugin,
  ICacheStrategy,
  // 统计类型
  PerformanceMetrics,
  // 错误类型
  CacheError,
  EvictionReason,
} from './types'

export {
  CacheStrategy,
  CacheEventType,
  CacheErrorCode,
} from './types'

// ============================================================
// 缓存策略
// ============================================================
export { LRUCache } from './strategies/lru'
export { LFUCache } from './strategies/lfu'
export { FIFOCache } from './strategies/fifo'
export { TTLCache } from './strategies/ttl'

// ============================================================
// 缓存管理器
// ============================================================
export {
  CacheManager,
  createCacheManager,
} from './cache-manager'

// ============================================================
// 序列化器
// ============================================================
export {
  JSONSerializer,
  createJSONSerializer,
  Base64Serializer,
  createBase64Serializer,
} from './serializers'

// ============================================================
// 存储适配器
// ============================================================
export type { IStorageAdapter, IndexedDBAdapterOptions } from './storage'
export {
  BaseStorageAdapter,
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBStorageAdapter,
  createIndexedDBAdapter,
} from './storage'

// ============================================================
// 插件
// ============================================================
export {
  LoggerPlugin,
  createLoggerPlugin,
  PerformancePlugin,
  createPerformancePlugin,
} from './plugins'
export type {
  LoggerPluginOptions,
  LogLevel,
  PerformancePluginOptions,
  PerformanceMetric,
  PerformanceStats,
  OperationStats,
} from './plugins'

// ============================================================
// 工具函数
// ============================================================
export {
  // 哈希工具
  hashString,
  generateCacheKey,
  parseCacheKey,
  generateId,
  // 定时器工具
  TimerManager,
  delay,
  measureTime,
  // 验证工具
  validateKey,
  validateValue,
  validateTTL,
  validateMaxSize,
  isExpired,
  isStorageAvailable,
  isIndexedDBAvailable,
  // 内存工具
  estimateMemoryUsage,
  estimateCacheItemSize,
  formatBytes,
  MemoryTracker,
  // 防抖节流
  debounce,
  throttle,
  createKeyedDebounce,
  createKeyedThrottle,
} from './utils'

export type {
  MemoryTrackerSummary,
  DebouncedFunction,
  ThrottledFunction,
  DebounceOptions,
  ThrottleOptions,
} from './utils'

// ============================================================
// 常量
// ============================================================
export {
  DEFAULT_CONFIG,
  PERFORMANCE,
  STORAGE,
  ERROR_MESSAGES,
  VERSION,
} from './constants'

// ============================================================
// 默认导出
// ============================================================
export { createCacheManager as default } from './cache-manager'

