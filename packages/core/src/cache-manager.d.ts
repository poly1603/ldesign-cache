/**
 * 缓存管理器 - 统一的缓存管理接口
 *
 * 整合所有缓存策略，提供统一的 API
 *
 * @module @ldesign/cache/core/cache-manager
 */
import type { BatchOptions, BatchResult, CacheEventListener, CacheItem, CacheOptions, CacheStats } from './types';
import { CacheEventType } from './types';
/**
 * 缓存管理器类
 *
 * 特点：
 * - 支持多种缓存策略（LRU、LFU、FIFO、TTL）
 * - 统一的 API 接口
 * - 事件监听机制
 * - 缓存统计功能
 * - 批量操作支持
 * - 持久化支持（可选）
 *
 * @template T - 缓存值类型
 *
 * @example
 * ```typescript
 * // 创建 LRU 缓存
 * const cache = new CacheManager<string>({
 *   strategy: CacheStrategy.LRU,
 *   maxSize: 100,
 *   defaultTTL: 5000,
 *   enableStats: true
 * })
 *
 * // 设置缓存
 * cache.set('key1', 'value1')
 *
 * // 获取缓存
 * const value = cache.get('key1')
 *
 * // 监听事件
 * cache.on('evict', (event) => {
 *   console.log('缓存项被淘汰:', event.key)
 * })
 *
 * // 获取统计信息
 * const stats = cache.getStats()
 * console.log('命中率:', stats.hitRate)
 * ```
 */
export declare class CacheManager<T = any> {
    private strategy;
    private options;
    private listeners;
    private stats;
    private cleanupTimer?;
    constructor(options?: CacheOptions);
    /**
     * 获取缓存项
     * @param key - 缓存键
     * @returns 缓存值，不存在或已过期返回 undefined
     */
    get(key: string): T | undefined;
    /**
     * 设置缓存项
     * @param key - 缓存键
     * @param value - 缓存值
     * @param ttl - 过期时间（毫秒），覆盖默认 TTL
     */
    set(key: string, value: T, ttl?: number): void;
    /**
     * 删除缓存项
     * @param key - 缓存键
     * @returns 是否删除成功
     */
    delete(key: string): boolean;
    /**
     * 检查缓存项是否存在
     * @param key - 缓存键
     * @returns 是否存在且未过期
     */
    has(key: string): boolean;
    /**
     * 清空所有缓存
     */
    clear(): void;
    /**
     * 获取缓存大小
     */
    get size(): number;
    /**
     * 获取所有键
     */
    keys(): string[];
    /**
     * 获取所有值
     */
    values(): T[];
    /**
     * 获取所有缓存项
     */
    entries(): Array<[string, T]>;
    /**
     * 获取缓存项详情
     * @param key - 缓存键
     * @returns 缓存项详情，不存在返回 undefined
     */
    getItem(key: string): CacheItem<T> | undefined;
    /**
     * 批量获取缓存项
     * @param keys - 缓存键数组
     * @returns 键值对 Map
     */
    mget(keys: string[]): Map<string, T>;
    /**
     * 批量设置缓存项
     * @param entries - 键值对数组
     * @param options - 批量操作选项
     * @returns 批量操作结果
     */
    mset(entries: Array<[string, T]>, options?: BatchOptions): BatchResult<void>;
    /**
     * 批量删除缓存项
     * @param keys - 缓存键数组
     * @param options - 批量操作选项
     * @returns 批量操作结果
     */
    mdel(keys: string[], options?: BatchOptions): BatchResult<boolean>;
    /**
     * 获取统计信息
     * @returns 缓存统计信息
     */
    getStats(): CacheStats;
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 清理过期项
     * @returns 清理的项数
     */
    cleanup(): number;
    /**
     * 监听缓存事件
     * @param type - 事件类型
     * @param listener - 事件监听器
     */
    on(type: CacheEventType, listener: CacheEventListener<T>): void;
    /**
     * 移除事件监听器
     * @param type - 事件类型
     * @param listener - 事件监听器
     */
    off(type: CacheEventType, listener: CacheEventListener<T>): void;
    /**
     * 触发事件
     * @param type - 事件类型
     * @param data - 事件数据
     */
    private emit;
    /**
     * 创建缓存策略实例
     */
    private createStrategy;
    /**
     * 更新命中率
     */
    private updateHitRate;
    /**
     * 更新内存占用估算
     */
    private updateMemoryUsage;
    /**
     * 启动自动清理定时器
     */
    private startAutoCleanup;
    /**
     * 停止自动清理定时器
     */
    stopAutoCleanup(): void;
    /**
     * 从持久化存储加载
     */
    private loadFromStorage;
    /**
     * 保存到持久化存储
     */
    private saveToStorage;
    /**
     * 从持久化存储删除
     */
    private removeFromStorage;
    /**
     * 清空持久化存储
     */
    private clearStorage;
    /**
     * 获取存储对象
     */
    private getStorage;
    /**
     * 销毁缓存实例
     */
    destroy(): void;
}
/**
 * 创建缓存管理器实例
 * @param options - 缓存配置选项
 * @returns 缓存管理器实例
 */
export declare function createCacheManager<T = any>(options?: CacheOptions): CacheManager<T>;
