/**
 * LFU (Least Frequently Used) 缓存策略实现
 *
 * 使用最小堆 + Map 实现高效的频率管理
 *
 * @module @ldesign/cache/core/strategies/lfu
 */
import type { CacheItem } from '../types';
/**
 * LFU 缓存策略类
 *
 * 特点：
 * - 淘汰访问频率最低的项
 * - 相同频率时淘汰最早访问的项
 * - 支持 TTL 过期时间
 * - O(1) 时间复杂度的 get 操作
 * - O(log n) 时间复杂度的 set 操作
 *
 * @template T - 缓存值类型
 *
 * @example
 * ```typescript
 * const cache = new LFUCache<string>(100)
 *
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2', 5000) // 5秒后过期
 *
 * // 获取缓存（增加访问频率）
 * cache.get('key1') // 频率 +1
 * cache.get('key1') // 频率 +1
 *
 * // key2 频率较低，会被优先淘汰
 * ```
 */
export declare class LFUCache<T = any> {
    private cache;
    private frequencyMap;
    private minFrequency;
    private maxSize;
    private defaultTTL?;
    constructor(maxSize?: number, defaultTTL?: number);
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
     * @returns 被淘汰的项（如果有）
     */
    set(key: string, value: T, ttl?: number): CacheItem<T> | undefined;
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
     * 清理所有过期项
     * @returns 清理的项数
     */
    cleanup(): number;
    /**
     * 更新节点频率
     */
    private updateFrequency;
    /**
     * 添加节点到频率映射
     */
    private addToFrequencyMap;
    /**
     * 从频率映射中移除节点
     */
    private removeFromFrequencyMap;
    /**
     * 淘汰最低频率的项
     * @returns 被淘汰的项
     */
    private evict;
}
