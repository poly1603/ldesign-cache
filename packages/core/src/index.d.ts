/**
 * @ldesign/cache/core - 核心缓存管理库
 *
 * 企业级缓存管理解决方案，支持多种缓存策略
 *
 * @module @ldesign/cache/core
 */
export type { CacheItem, CacheOptions, CacheStats, CacheEvent, CacheEventListener, BatchOptions, BatchResult, Serializer, CachePlugin, ICacheStrategy, PerformanceMetrics, } from './types';
export { CacheStrategy, CacheEventType, } from './types';
export { LRUCache } from './strategies/lru';
export { LFUCache } from './strategies/lfu';
export { FIFOCache } from './strategies/fifo';
export { TTLCache } from './strategies/ttl';
export { CacheManager, createCacheManager, } from './cache-manager';
export { JSONSerializer, createJSONSerializer, Base64Serializer, createBase64Serializer, } from './serializers';
export type { IStorageAdapter } from './storage';
export { BaseStorageAdapter, MemoryStorageAdapter, LocalStorageAdapter, SessionStorageAdapter, } from './storage';
export { LoggerPlugin, createLoggerPlugin, } from './plugins';
export type { LoggerPluginOptions, LogLevel } from './plugins';
export { hashString, generateCacheKey, parseCacheKey, generateId, TimerManager, delay, measureTime, validateKey, validateValue, validateTTL, validateMaxSize, isExpired, isStorageAvailable, isIndexedDBAvailable, } from './utils';
export { DEFAULT_CONFIG, PERFORMANCE, STORAGE, ERROR_MESSAGES, VERSION, } from './constants';
export { createCacheManager as default } from './cache-manager';
