/**
 * FIFO (First In First Out) 缓存策略实现
 *
 * 使用队列实现，先进先出，最简单的淘汰策略
 *
 * @module @ldesign/cache/core/strategies/fifo
 */
import type { CacheItem } from '../types';
/**
 * FIFO 缓存策略类
 *
 * 特点：
 * - 先进先出，最简单的淘汰策略
 * - O(1) 时间复杂度的所有操作
 * - 不考虑访问频率和时间
 * - 支持 TTL 过期时间
 * - 内存占用最小
 *
 * @template T - 缓存值类型
 *
 * @example
 * ```typescript
 * const cache = new FIFOCache<string>(100)
 *
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2')
 * cache.set('key3', 'value3')
 *
 * // 当容量满时，key1 会被最先淘汰（最早添加）
 * ```
 */
export declare class FIFOCache<T = any> {
    private cache;
    private queue;
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
     * 淘汰最早添加的项（队列头部）
     * @returns 被淘汰的项
     */
    private evict;
}
