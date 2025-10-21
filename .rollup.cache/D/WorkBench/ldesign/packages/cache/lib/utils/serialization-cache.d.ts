/**
 * 序列化缓存配置
 */
export interface SerializationCacheConfig {
    /** 最大缓存条目数 */
    maxSize?: number;
    /** 条目过期时间（毫秒） */
    ttl?: number;
    /** 是否启用统计 */
    enableStats?: boolean;
}
/**
 * 序列化缓存类
 *
 * 提供高性能的序列化结果缓存，使用 LRU 策略管理
 *
 * @example
 * ```typescript
 * const cache = new SerializationCache({ maxSize: 1000, ttl: 5000 })
 *
 * // 缓存序列化结果
 * const serialized = cache.getOrSet('key', () => JSON.stringify(data))
 *
 * // 获取统计信息
 * )
 * ```
 */
export declare class SerializationCache<T = string> {
    /** 缓存存储 */
    private cache;
    /** 最大缓存大小 */
    private readonly maxSize;
    /** 条目过期时间 */
    private readonly ttl;
    /** 是否启用统计 */
    private readonly enableStats;
    private hits;
    private misses;
    private evictions;
    /**
     * 构造函数
     */
    constructor(config?: SerializationCacheConfig);
    /**
     * 获取缓存值
     *
     * @param key - 缓存键
     * @returns 缓存的值，如果不存在或已过期则返回 null
     */
    get(key: string): T | null;
    /**
     * 设置缓存值
     *
     * @param key - 缓存键
     * @param value - 要缓存的值
     */
    set(key: string, value: T): void;
    /**
     * 获取或设置缓存值
     *
     * 如果缓存存在且未过期，返回缓存值；
     * 否则调用 factory 函数生成新值并缓存
     *
     * @param key - 缓存键
     * @param factory - 值生成函数
     * @returns 缓存值或新生成的值
     */
    getOrSet(key: string, factory: () => T): T;
    /**
     * 删除缓存条目
     *
     * @param key - 缓存键
     * @returns 是否成功删除
     */
    delete(key: string): boolean;
    /**
     * 清空所有缓存
     */
    clear(): void;
    /**
     * 获取缓存大小
     */
    get size(): number;
    /**
     * 淘汰 LRU 条目（优化版本）
     *
     * 使用 Map 的迭代顺序特性，第一个元素就是最久未访问的
     * Map 保持插入顺序，当我们更新时会移到末尾
     */
    private evictLRU;
    /**
     * 获取统计信息
     */
    getStats(): {
        size: number;
        maxSize: number;
        hits: number;
        misses: number;
        evictions: number;
        hitRate: number;
        averageAccessCount: number;
    };
    /**
     * 重置统计信息
     */
    resetStats(): void;
    /**
     * 获取所有缓存键
     */
    keys(): string[];
    /**
     * 检查键是否存在
     */
    has(key: string): boolean;
    /**
     * 清理过期条目
     *
     * @returns 清理的条目数
     */
    cleanup(): number;
}
/**
 * 创建序列化缓存实例
 *
 * @param config - 缓存配置
 * @returns 序列化缓存实例
 */
export declare function createSerializationCache<T = string>(config?: SerializationCacheConfig): SerializationCache<T>;
/**
 * 全局序列化缓存实例（用于序列化操作）
 */
export declare const globalSerializeCache: SerializationCache<string>;
/**
 * 全局反序列化缓存实例（用于反序列化操作）
 */
export declare const globalDeserializeCache: SerializationCache<unknown>;
/**
 * 带缓存的序列化函数
 *
 * @param value - 要序列化的值
 * @param key - 缓存键（可选，默认使用值的哈希）
 * @returns 序列化后的字符串
 */
export declare function serializeWithCache(value: unknown, key?: string): string;
/**
 * 带缓存的反序列化函数
 *
 * @param serialized - 序列化的字符串
 * @param key - 缓存键（可选，默认使用字符串本身）
 * @returns 反序列化后的值
 */
export declare function deserializeWithCache<T = unknown>(serialized: string, key?: string): T;
