/**
 * @ldesign/cache - 功能强大的浏览器缓存管理库
 *
 * 提供多存储引擎支持、智能存储策略、安全特性和 Vue 3 深度集成
 *
 * @author LDesign Team
 * @version 0.1.0
 */
import { CacheManager } from './core/cache-manager';
import { StorageEngineFactory } from './engines/factory';
import { getPresetOptions } from './presets';
// ============================================================================
// 核心模块导出
// ============================================================================
// 缓存分析器
export { CacheAnalyzer, createCacheAnalyzer } from './core/cache-analyzer';
// 缓存管理器
export { CacheManager } from './core/cache-manager';
// 内存管理
export { createMemoryManager, MemoryManager } from './core/memory-manager';
// 命名空间管理
export { CacheNamespace, createNamespace } from './core/namespace-manager';
// 性能监控
export { PerformanceMonitor } from './core/performance-monitor';
// 智能预取
export { createPrefetchManager, PrefetchManager } from './core/prefetch-manager';
// 快照管理
export { createSnapshotManager, SnapshotManager } from './core/snapshot-manager';
// 跨标签页同步
export { SyncManager } from './core/sync-manager';
// 标签管理
export { createTagManager, TagManager } from './core/tag-manager';
// 版本管理
export { createVersionManager, VersionManager } from './core/version-manager';
// 缓存预热
export { createWarmupManager, WarmupManager } from './core/warmup-manager';
// ============================================================================
// 存储引擎导出
// ============================================================================
// 引擎插件
export { createCacheEnginePlugin } from './engine/plugin';
// 基础引擎
export { BaseStorageEngine } from './engines/base-engine';
// 具体引擎实现
export { CookieEngine } from './engines/cookie-engine';
// 引擎工厂
export { StorageEngineFactory } from './engines/factory';
export { IndexedDBEngine } from './engines/indexeddb-engine';
export { LocalStorageEngine } from './engines/local-storage-engine';
export { MemoryEngine } from './engines/memory-engine';
export { SessionStorageEngine } from './engines/session-storage-engine';
// ============================================================================
// 策略模块导出
// ============================================================================
export { createBrowserCache, createNodeCache, createOfflineCache, createSSRCache, getPresetOptions, } from './presets';
// 加密和混淆
export { AESCrypto } from './security/aes-crypto';
// ============================================================================
// 安全模块导出
// ============================================================================
export { KeyObfuscator } from './security/key-obfuscator';
// 安全管理器
export { SecurityManager } from './security/security-manager';
// 淘汰策略
export * from './strategies/eviction-strategies';
// ============================================================================
// 工具模块导出
// ============================================================================
// 存储策略
export { StorageStrategy } from './strategies/storage-strategy';
export * from './types';
// ============================================================================
// 预设配置导出
// ============================================================================
// 其他工具
export * from './utils';
// ============================================================================
// 类型定义导出
// ============================================================================
// 重试和容错
export { CircuitBreaker, RetryManager, withCircuitBreaker, withFallback } from './utils/retry-manager';
/**
 * 自动检测当前运行环境
 *
 * @returns 检测到的环境类型
 */
function detectPreset() {
    // 浏览器环境（含 jsdom 测试环境）
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        return 'browser';
    }
    // Node.js 环境
    // eslint-disable-next-line node/prefer-global/process
    if (typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined' && globalThis.process?.versions?.node) {
        return 'node';
    }
    // SSR 或其他服务端渲染环境
    return 'ssr';
}
// ============================================================================
// 工厂函数
// ============================================================================
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
export function createCache(options) {
    const preset = options?.preset ?? detectPreset();
    const { preset: _preset, ...rest } = options || {};
    const merged = { ...getPresetOptions(preset), ...rest };
    return new CacheManager(merged);
}
/**
 * 获取默认缓存管理器实例（懒初始化单例）
 *
 * 避免在 SSR/Node 环境下提前触发浏览器 API 导致错误
 *
 * @param options - 缓存配置选项（仅在首次调用时生效）
 * @returns 默认缓存管理器实例
 */
let _defaultCache = null;
export function getDefaultCache(options) {
    if (!_defaultCache) {
        _defaultCache = createCache(options);
    }
    return _defaultCache;
}
// ============================================================================
// 便捷 API
// ============================================================================
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
export const cache = {
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
    },
};
// ============================================================================
// 默认导出
// ============================================================================
/**
 * 默认导出对象，包含主要的类和函数
 */
export default {
    CacheManager,
    createCache,
    getDefaultCache,
    cache,
    StorageEngineFactory,
};
//# sourceMappingURL=index.js.map