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
type DetectedPreset = 'browser' | 'ssr' | 'node' | 'offline';
export declare function createCache(options?: CacheOptions & {
    preset?: DetectedPreset;
}): CacheManager;
export declare function getDefaultCache(options?: CacheOptions & {
    preset?: DetectedPreset;
}): CacheManager;
export declare const cache: {
    readonly get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T>;
    readonly set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: import("./types").SetOptions) => Promise<void>;
    readonly remove: (key: string) => Promise<void>;
    readonly clear: (engine?: import("./types").StorageEngine) => Promise<void>;
    readonly has: (key: string) => Promise<boolean>;
    readonly keys: (engine?: import("./types").StorageEngine) => Promise<string[]>;
    readonly getStats: () => Promise<import("./types").CacheStats>;
    readonly remember: <T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: import("./types").SetOptions & {
        refresh?: boolean;
    }) => Promise<T>;
    readonly manager: () => CacheManager;
};
declare const _default: {
    readonly CacheManager: typeof CacheManager;
    readonly createCache: typeof createCache;
    readonly getDefaultCache: typeof getDefaultCache;
    readonly cache: {
        readonly get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T>;
        readonly set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: import("./types").SetOptions) => Promise<void>;
        readonly remove: (key: string) => Promise<void>;
        readonly clear: (engine?: import("./types").StorageEngine) => Promise<void>;
        readonly has: (key: string) => Promise<boolean>;
        readonly keys: (engine?: import("./types").StorageEngine) => Promise<string[]>;
        readonly getStats: () => Promise<import("./types").CacheStats>;
        readonly remember: <T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: import("./types").SetOptions & {
            refresh?: boolean;
        }) => Promise<T>;
        readonly manager: () => CacheManager;
    };
    readonly StorageEngineFactory: typeof StorageEngineFactory;
};
export default _default;
//# sourceMappingURL=index.d.ts.map