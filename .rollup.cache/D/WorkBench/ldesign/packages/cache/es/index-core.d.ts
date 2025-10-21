/**
 * @ldesign/cache - 核心入口
 *
 * 只包含最基础的缓存功能，体积最小
 */
/**
 * @ldesign/cache - 核心入口
 *
 * 只包含最基础的缓存功能，体积最小
 * 使用统一的预设配置系统
 */
import { CacheManager } from './core/cache-manager';
export { CacheManager } from './core/cache-manager';
export { LocalStorageEngine } from './engines/local-storage-engine';
export { MemoryEngine } from './engines/memory-engine';
export { SessionStorageEngine } from './engines/session-storage-engine';
export type { BaseEngineOptions, CacheError, CacheEvent, CacheEventListener, CacheEventType, CacheMetadata, CacheOptions, CacheStats, ClearOptions, CookieEngineOptions, EngineOptions, ErrorType, EventListener, EventMap, GetOptions, IndexedDBEngineOptions, LocalStorageEngineOptions, MemoryEngineOptions, RemoveOptions, SerializableValue, SessionStorageEngineOptions, SetOptions, StorageEngine, } from './types';
export { ErrorHandler } from './utils/error-handler';
export { EventEmitter } from './utils/event-emitter';
/**
 * 核心支持的预设类型（子集）
 */
export type CorePreset = 'memory' | 'browser' | 'session';
/**
 * 创建核心缓存管理器
 *
 * @param preset - 预设类型，支持 memory、browser、session
 * @returns 缓存管理器实例
 */
export declare function createCoreCache(preset?: CorePreset): CacheManager;
