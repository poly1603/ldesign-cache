/**
 * LRU (Least Recently Used) 缓存策略实现
 *
 * 使用双向链表 + Map 实现 O(1) 时间复杂度的读写操作
 *
 * @module @ldesign/cache/core/strategies/lru
 */
import type { CacheItem } from '../types';
/**
 * LRU 缓存策略类
 *
 * 特点：
 * - O(1) 时间复杂度的 get/set/delete 操作
 * - 自动淘汰最久未使用的项
 * - 支持 TTL 过期时间
 * - 内存占用最优
 *
 * @template T - 缓存值类型
 *
 * @example
 * ```typescript
 * const cache = new LRUCache<string>({ maxSize: 100 })
 *
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2', 5000) // 5秒后过期
 *
 * // 获取缓存
 * const value = cache.get('key1') // 'value1'
 *
 * // 删除缓存
 * cache.delete('key1')
 *
 * // 清空缓存
 * cache.clear()
 * ```
 */
export declare class LRUCache<T = any> {
    private cache;
    private head;
    private tail;
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
     * 移动节点到链表头部
     */
    private moveToHead;
    /**
     * 添加节点到链表头部
     */
    private addToHead;
    /**
     * 从链表中移除节点
     */
    private removeNode;
    /**
     * 移除链表尾部节点
     */
    private removeTail;
}
