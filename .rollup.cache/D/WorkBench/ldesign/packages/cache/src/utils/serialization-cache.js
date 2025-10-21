import { CACHE_SIZE, TIME_INTERVALS } from '../constants/performance';
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
export class SerializationCache {
    /**
     * 构造函数
     */
    constructor(config = {}) {
        /** 缓存存储 */
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 最大缓存大小 */
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 条目过期时间 */
        Object.defineProperty(this, "ttl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** 是否启用统计 */
        Object.defineProperty(this, "enableStats", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // 统计信息
        Object.defineProperty(this, "hits", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "misses", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "evictions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.cache = new Map();
        this.maxSize = config.maxSize ?? CACHE_SIZE.SERIALIZATION_DEFAULT;
        this.ttl = config.ttl ?? TIME_INTERVALS.SERIALIZATION_TTL_DEFAULT;
        this.enableStats = config.enableStats ?? true;
    }
    /**
     * 获取缓存值
     *
     * @param key - 缓存键
     * @returns 缓存的值，如果不存在或已过期则返回 null
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            if (this.enableStats) {
                this.misses++;
            }
            return null;
        }
        // 检查是否过期
        const now = Date.now();
        if (now - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            if (this.enableStats) {
                this.misses++;
            }
            return null;
        }
        // 更新访问信息
        entry.accessCount++;
        entry.lastAccess = now;
        if (this.enableStats) {
            this.hits++;
        }
        return entry.value;
    }
    /**
     * 设置缓存值
     *
     * @param key - 缓存键
     * @param value - 要缓存的值
     */
    set(key, value) {
        const now = Date.now();
        // 如果已存在，删除旧的并重新添加到末尾（LRU更新）
        const existing = this.cache.get(key);
        if (existing) {
            this.cache.delete(key);
            this.cache.set(key, {
                value,
                timestamp: now,
                accessCount: existing.accessCount + 1,
                lastAccess: now,
            });
            return;
        }
        // 检查是否需要淘汰
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        // 添加新条目
        this.cache.set(key, {
            value,
            timestamp: now,
            accessCount: 1,
            lastAccess: now,
        });
    }
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
    getOrSet(key, factory) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const value = factory();
        this.set(key, value);
        return value;
    }
    /**
     * 删除缓存条目
     *
     * @param key - 缓存键
     * @returns 是否成功删除
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * 清空所有缓存
     */
    clear() {
        this.cache.clear();
        if (this.enableStats) {
            this.hits = 0;
            this.misses = 0;
            this.evictions = 0;
        }
    }
    /**
     * 获取缓存大小
     */
    get size() {
        return this.cache.size;
    }
    /**
     * 淘汰 LRU 条目（优化版本）
     *
     * 使用 Map 的迭代顺序特性，第一个元素就是最久未访问的
     * Map 保持插入顺序，当我们更新时会移到末尾
     */
    evictLRU() {
        // Map的第一个元素是最久未访问的
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
            this.cache.delete(firstKey);
            if (this.enableStats) {
                this.evictions++;
            }
        }
    }
    /**
     * 获取统计信息
     */
    getStats() {
        const totalRequests = this.hits + this.misses;
        const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
        // 计算平均访问次数
        let totalAccessCount = 0;
        for (const entry of this.cache.values()) {
            totalAccessCount += entry.accessCount;
        }
        const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
            hitRate,
            averageAccessCount,
        };
    }
    /**
     * 重置统计信息
     */
    resetStats() {
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
    }
    /**
     * 获取所有缓存键
     */
    keys() {
        return Array.from(this.cache.keys());
    }
    /**
     * 检查键是否存在
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return false;
        }
        // 检查是否过期
        const now = Date.now();
        if (now - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    /**
     * 清理过期条目
     *
     * @returns 清理的条目数
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, entry] of this.cache) {
            if (now - entry.timestamp > this.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        return cleaned;
    }
}
/**
 * 创建序列化缓存实例
 *
 * @param config - 缓存配置
 * @returns 序列化缓存实例
 */
export function createSerializationCache(config) {
    return new SerializationCache(config);
}
/**
 * 全局序列化缓存实例（用于序列化操作）
 */
export const globalSerializeCache = createSerializationCache({
    maxSize: CACHE_SIZE.SIZE_CACHE_LIMIT,
    ttl: TIME_INTERVALS.SERIALIZATION_TTL_MAX,
});
/**
 * 全局反序列化缓存实例（用于反序列化操作）
 */
export const globalDeserializeCache = createSerializationCache({
    maxSize: CACHE_SIZE.SIZE_CACHE_LIMIT,
    ttl: TIME_INTERVALS.SERIALIZATION_TTL_MAX,
});
/**
 * 带缓存的序列化函数
 *
 * @param value - 要序列化的值
 * @param key - 缓存键（可选，默认使用值的哈希）
 * @returns 序列化后的字符串
 */
export function serializeWithCache(value, key) {
    const cacheKey = key ?? generateCacheKey(value);
    return globalSerializeCache.getOrSet(cacheKey, () => JSON.stringify(value));
}
/**
 * 带缓存的反序列化函数
 *
 * @param serialized - 序列化的字符串
 * @param key - 缓存键（可选，默认使用字符串本身）
 * @returns 反序列化后的值
 */
export function deserializeWithCache(serialized, key) {
    const cacheKey = key ?? serialized;
    return globalDeserializeCache.getOrSet(cacheKey, () => JSON.parse(serialized));
}
/**
 * 生成缓存键
 *
 * 使用简单的哈希算法生成缓存键
 *
 * @param value - 要生成键的值
 * @returns 缓存键
 */
function generateCacheKey(value) {
    // 对于简单类型，直接转换为字符串
    if (value === null || value === undefined) {
        return String(value);
    }
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        return `${type}:${value}`;
    }
    // 对于对象，使用简单的哈希
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为 32 位整数
    }
    return `obj:${hash}`;
}
//# sourceMappingURL=serialization-cache.js.map