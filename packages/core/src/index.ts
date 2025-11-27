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
  CacheItem,
  CacheOptions,
  CacheStats,
  CacheEvent,
  CacheEventListener,
  BatchOptions,
  BatchResult,
  Serializer,
  CachePlugin,
  ICacheStrategy,
  PerformanceMetrics,
} from './types'

export {
  CacheStrategy,
  CacheEventType,
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
export type { IStorageAdapter } from './storage'
export {
  BaseStorageAdapter,
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
} from './storage'

// ============================================================
// 插件
// ============================================================
export {
  LoggerPlugin,
  createLoggerPlugin,
} from './plugins'
export type { LoggerPluginOptions, LogLevel } from './plugins'

// ============================================================
// 工具函数
// ============================================================
export {
  hashString,
  generateCacheKey,
  parseCacheKey,
  generateId,
  TimerManager,
  delay,
  measureTime,
  validateKey,
  validateValue,
  validateTTL,
  validateMaxSize,
  isExpired,
  isStorageAvailable,
  isIndexedDBAvailable,
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

