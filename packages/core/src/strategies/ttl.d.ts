/**
 * TTL (Time To Live) 缓存策略实现
 *
 * 基于过期时间的缓存策略，自动清理过期项
 *
 * @module @ldesign/cache/core/strategies/ttl
 */
import type { CacheItem } from '../types';
/**
 * TTL 缓存策略类
 *
 * 特点：
 * - 所有项都必须设置 TTL
 * - 自动清理过期项
 * - 支持定时清理和惰性清理
 * - O(1) 时间复杂度的 get/set/delete 操作
 * - 适合需要严格过期控制的场景
 *
 * @template T - 缓存值类型
 *
 * @example
 * ```typescript
 * const cache = new TTLCache<string>({
 *   defaultTTL: 5000, // 默认 5 秒过期
 *   cleanupInterval: 1000 // 每秒清理一次
 * })
 *
 * // 设置缓存（使用默认 TTL）
 * cache.set('key1', 'value1')
 *
 * // 设置缓存（自定义 TTL）
 * cache.set('key2', 'value2', 10000) // 10 秒后过期
 *
 * // 5 秒后 key1 自动过期
 * setTimeout(() => {
 *   console.log(cache.get('key1')) // undefined
 * }, 5000)
 * ```
 */
export declare class TTLCache<T = any> {
    private cache;
    private defaultTTL;
    private cleanupInterval;
    private cleanupTimer?;
    constructor(defaultTTL?: number, cleanupInterval?: number);
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
     * 刷新缓存项的过期时间
     * @param key - 缓存键
     * @param ttl - 新的 TTL（可选，默认使用原 TTL）
     * @returns 是否刷新成功
     */
    refresh(key: string, ttl?: number): boolean;
    /**
     * 获取缓存项的剩余 TTL
     * @param key - 缓存键
     * @returns 剩余 TTL（毫秒），不存在或已过期返回 -1
     */
    getRemainingTTL(key: string): number;
    /**
     * 清理所有过期项
     * @returns 清理的项数
     */
    cleanup(): number;
    /**
     * 启动自动清理定时器
     */
    private startAutoCleanup;
    /**
     * 停止自动清理定时器
     */
    stopAutoCleanup(): void;
    /**
     * 销毁缓存实例
     */
    destroy(): void;
}
