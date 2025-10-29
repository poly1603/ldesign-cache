/**
 * @ldesign/cache-core
 * 
 * Framework-agnostic cache management system
 */

// 核心管理器
export { CacheManager } from './core/cache-manager'
export { createCache, getDefaultCache, cache } from './factory'

// 分析和监控
export { CacheAnalyzer, createCacheAnalyzer } from './core/cache-analyzer'
export { MemoryManager, createMemoryManager } from './core/memory-manager'
export { PerformanceMonitor } from './core/performance-monitor'
export { PerformanceTracker } from './core/performance-tracker'

// 命名空间和标签
export { CacheNamespace, createNamespace } from './core/namespace-manager'
export { TagManager, createTagManager } from './core/tag-manager'

// 智能功能
export { PrefetchManager, createPrefetchManager } from './core/prefetch-manager'
export { PredictiveCache, createPredictiveCache } from './core/predictive-cache'

// 插件系统
export {
  PluginManager,
  createLoggingPlugin,
  createPerformancePlugin,
  createStatsPlugin,
} from './core/plugin-system'

// 快照和版本
export { SnapshotManager, createSnapshotManager } from './core/snapshot-manager'
export { VersionManager, createVersionManager } from './core/version-manager'

// 同步功能
export { SyncManager } from './core/sync-manager'
export {
  RemoteSyncManager,
  WebSocketTransport,
  PollingTransport,
  SSETransport,
} from './core/remote-sync-adapter'

// 预热功能
export { WarmupManager, createWarmupManager } from './core/warmup-manager'

// 存储引擎
export { BaseStorageEngine } from './engines/base-engine'
export { StorageEngineFactory } from './engines/factory'
export { MemoryEngine } from './engines/memory-engine'
export { LocalStorageEngine } from './engines/local-storage-engine'
export { SessionStorageEngine } from './engines/session-storage-engine'
export { IndexedDBEngine } from './engines/indexeddb-engine'
export { CookieEngine } from './engines/cookie-engine'
export { OPFSEngine } from './engines/opfs-engine'

// 策略
export * from './strategies/eviction-strategies'
export { StorageStrategy } from './strategies/storage-strategy'
export { AdaptiveStorageStrategy, createAdaptiveStrategy } from './strategies/adaptive-strategy'

// 安全功能
export { AESCrypto } from './security/aes-crypto'
export { KeyObfuscator } from './security/key-obfuscator'
export { SecurityManager } from './security/security-manager'

// 工具函数
export * from './utils'
export * from './helpers'

// 类型导出
export type * from './types'

// 预设配置
export {
  createBrowserCache,
  createNodeCache,
  createOfflineCache,
  createSSRCache,
  getPresetOptions,
} from './presets'

// 版本
export const version = '0.2.0'
