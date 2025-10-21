/**
 * @ldesign/cache - 功能强大的浏览器缓存管理库
 *
 * 提供多存储引擎支持、智能存储策略、安全特性和 Vue 3 深度集成
 *
 * @author LDesign Team
 * @version 0.1.0
 */
import type { CacheOptions, SerializableValue } from './types';
import { CacheManager } from './core/cache-manager';
import { StorageEngineFactory } from './engines/factory';
export { CacheAnalyzer, createCacheAnalyzer } from './core/cache-analyzer';
export type { AccessPattern, AnalysisReport, PerformanceMetrics as AnalyzerPerformanceMetrics, OptimizationSuggestion, } from './core/cache-analyzer';
export { CacheManager } from './core/cache-manager';
export { createMemoryManager, MemoryManager } from './core/memory-manager';
export type { MemoryManagerConfig, MemoryStats } from './core/memory-manager';
export { CacheNamespace, createNamespace } from './core/namespace-manager';
export type { NamespaceOptions } from './core/namespace-manager';
export { PerformanceMonitor } from './core/performance-monitor';
export type { PerformanceMetrics as MonitorPerformanceMetrics, PerformanceMonitorOptions, PerformanceStats, } from './core/performance-monitor';
export { createPrefetchManager, PrefetchManager } from './core/prefetch-manager';
export type { PrefetchStrategy, WarmupConfig } from './core/prefetch-manager';
export { createSnapshotManager, SnapshotManager } from './core/snapshot-manager';
export type { CacheSnapshot, RestoreOptions, SnapshotOptions } from './core/snapshot-manager';
export { SyncManager } from './core/sync-manager';
export type { SyncOptions } from './core/sync-manager';
export { createTagManager, TagManager } from './core/tag-manager';
export type { TagConfig } from './core/tag-manager';
export { createVersionManager, VersionManager } from './core/version-manager';
export type { MigrationConfig, MigrationFunction, VersionConfig } from './core/version-manager';
export { createWarmupManager, WarmupManager } from './core/warmup-manager';
export { createCacheEnginePlugin } from './engine/plugin';
export type { CacheEnginePluginOptions } from './engine/plugin';
export { BaseStorageEngine } from './engines/base-engine';
export { CookieEngine } from './engines/cookie-engine';
export { StorageEngineFactory } from './engines/factory';
export { IndexedDBEngine } from './engines/indexeddb-engine';
export { LocalStorageEngine } from './engines/local-storage-engine';
export { MemoryEngine } from './engines/memory-engine';
export { SessionStorageEngine } from './engines/session-storage-engine';
export { createBrowserCache, createNodeCache, createOfflineCache, createSSRCache, getPresetOptions, } from './presets';
export { AESCrypto } from './security/aes-crypto';
export { KeyObfuscator } from './security/key-obfuscator';
export { SecurityManager } from './security/security-manager';
export * from './strategies/eviction-strategies';
export { StorageStrategy } from './strategies/storage-strategy';
export * from './types';
export * from './utils';
export { CircuitBreaker, RetryManager, withCircuitBreaker, withFallback } from './utils/retry-manager';
/**
 * 支持的环境预设类型
 */
type DetectedPreset = 'browser' | 'ssr' | 'node' | 'offline';
/**
 * 创建缓存管理器实例
 *
 * 自动根据运行环境选择最适合的预设配置，也可以通过 preset 参数显式指定
 *
 * @param options - 缓存配置选项
 * @param options.preset - 显式指定环境预设，覆盖自动检测
 * @returns 缓存管理器实例
 *
 * @example
 * ```typescript
 * // 自动检测环境
 * const cache = createCache()
 *
 * // 显式指定浏览器环境
 * const browserCache = createCache({ preset: 'browser' })
 *
 * // 自定义配置
 * const customCache = createCache({
 *   defaultEngine: 'localStorage',
 *   defaultTTL: 24 * 60 * 60 * 1000, // 24小时
 *   security: {
 *     encryption: { enabled: true },
 *     obfuscation: { enabled: true }
 *   }
 * })
 * ```
 */
export declare function createCache(options?: CacheOptions & {
    preset?: DetectedPreset;
}): CacheManager;
export declare function getDefaultCache(options?: CacheOptions & {
    preset?: DetectedPreset;
}): CacheManager;
/**
 * 全局缓存实例的便捷 API
 *
 * 提供简洁的缓存操作接口，内部使用懒初始化的默认缓存实例
 *
 * @example
 * ```typescript
 * import { cache } from '@ldesign/cache'
 *
 * // 设置缓存
 * await cache.set('user', { name: '张三', age: 25 })
 *
 * // 获取缓存
 * const user = await cache.get<User>('user')
 *
 * // 记忆函数模式
 * const userData = await cache.remember('user-data', async () => {
 *   return await fetchUserFromAPI()
 * }, { ttl: 5 * 60 * 1000 })
 * ```
 */
export declare const cache: {
    /**
     * 获取缓存值
     * @param key - 缓存键
     * @returns 缓存值或 null
     */
    readonly get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T | null>;
    /**
     * 设置缓存值
     * @param key - 缓存键
     * @param value - 缓存值
     * @param options - 设置选项
     */
    readonly set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: import("./types").SetOptions) => Promise<void>;
    /**
     * 删除指定键的缓存
     * @param key - 缓存键
     */
    readonly remove: (key: string) => Promise<void>;
    /**
     * 清空缓存
     * @param engine - 可选，指定要清空的存储引擎
     */
    readonly clear: (engine?: import("./types").StorageEngine) => Promise<void>;
    /**
     * 检查键是否存在
     * @param key - 缓存键
     * @returns 是否存在
     */
    readonly has: (key: string) => Promise<boolean>;
    /**
     * 获取所有键名
     * @param engine - 可选，指定存储引擎
     * @returns 键名数组
     */
    readonly keys: (engine?: import("./types").StorageEngine) => Promise<string[]>;
    /**
     * 获取缓存统计信息
     * @returns 统计信息
     */
    readonly getStats: () => Promise<import("./types").CacheStats>;
    /**
     * 记忆函数：如果缓存不存在则执行 fetcher 并缓存结果
     * @param key - 缓存键
     * @param fetcher - 数据获取函数
     * @param options - 设置选项
     * @returns 缓存值
     */
    readonly remember: <T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: import("./types").SetOptions & {
        refresh?: boolean;
    }) => Promise<T>;
    /**
     * 获取底层缓存管理器实例
     * @returns 缓存管理器实例
     */
    readonly manager: () => CacheManager;
};
/**
 * 默认导出对象，包含主要的类和函数
 */
declare const _default: {
    readonly CacheManager: typeof CacheManager;
    readonly createCache: typeof createCache;
    readonly getDefaultCache: typeof getDefaultCache;
    readonly cache: {
        /**
         * 获取缓存值
         * @param key - 缓存键
         * @returns 缓存值或 null
         */
        readonly get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T | null>;
        /**
         * 设置缓存值
         * @param key - 缓存键
         * @param value - 缓存值
         * @param options - 设置选项
         */
        readonly set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: import("./types").SetOptions) => Promise<void>;
        /**
         * 删除指定键的缓存
         * @param key - 缓存键
         */
        readonly remove: (key: string) => Promise<void>;
        /**
         * 清空缓存
         * @param engine - 可选，指定要清空的存储引擎
         */
        readonly clear: (engine?: import("./types").StorageEngine) => Promise<void>;
        /**
         * 检查键是否存在
         * @param key - 缓存键
         * @returns 是否存在
         */
        readonly has: (key: string) => Promise<boolean>;
        /**
         * 获取所有键名
         * @param engine - 可选，指定存储引擎
         * @returns 键名数组
         */
        readonly keys: (engine?: import("./types").StorageEngine) => Promise<string[]>;
        /**
         * 获取缓存统计信息
         * @returns 统计信息
         */
        readonly getStats: () => Promise<import("./types").CacheStats>;
        /**
         * 记忆函数：如果缓存不存在则执行 fetcher 并缓存结果
         * @param key - 缓存键
         * @param fetcher - 数据获取函数
         * @param options - 设置选项
         * @returns 缓存值
         */
        readonly remember: <T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: import("./types").SetOptions & {
            refresh?: boolean;
        }) => Promise<T>;
        /**
         * 获取底层缓存管理器实例
         * @returns 缓存管理器实例
         */
        readonly manager: () => CacheManager;
    };
    readonly StorageEngineFactory: typeof StorageEngineFactory;
};
export default _default;
