/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
'use strict';

var performance = require('../constants/performance.cjs');

class SerializationCache {
  /**
   * 构造函数
   */
  constructor(config = {}) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "ttl", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "enableStats", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
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
    this.cache = /* @__PURE__ */ new Map();
    this.maxSize = config.maxSize ?? performance.CACHE_SIZE.SERIALIZATION_DEFAULT;
    this.ttl = config.ttl ?? performance.TIME_INTERVALS.SERIALIZATION_TTL_DEFAULT;
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
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.misses++;
      }
      return null;
    }
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
    const existing = this.cache.get(key);
    if (existing) {
      this.cache.delete(key);
      this.cache.set(key, {
        value,
        timestamp: now,
        accessCount: existing.accessCount + 1,
        lastAccess: now
      });
      return;
    }
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccess: now
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
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== void 0) {
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
      averageAccessCount
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
function createSerializationCache(config) {
  return new SerializationCache(config);
}
const globalSerializeCache = createSerializationCache({
  maxSize: performance.CACHE_SIZE.SIZE_CACHE_LIMIT,
  ttl: performance.TIME_INTERVALS.SERIALIZATION_TTL_MAX
});
const globalDeserializeCache = createSerializationCache({
  maxSize: performance.CACHE_SIZE.SIZE_CACHE_LIMIT,
  ttl: performance.TIME_INTERVALS.SERIALIZATION_TTL_MAX
});
function serializeWithCache(value, key) {
  const cacheKey = key ?? generateCacheKey(value);
  return globalSerializeCache.getOrSet(cacheKey, () => JSON.stringify(value));
}
function deserializeWithCache(serialized, key) {
  const cacheKey = key ?? serialized;
  return globalDeserializeCache.getOrSet(cacheKey, () => JSON.parse(serialized));
}
function generateCacheKey(value) {
  if (value === null || value === void 0) {
    return String(value);
  }
  const type = typeof value;
  if (type === "string" || type === "number" || type === "boolean") {
    return `${type}:${value}`;
  }
  const str = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `obj:${hash}`;
}

exports.SerializationCache = SerializationCache;
exports.createSerializationCache = createSerializationCache;
exports.deserializeWithCache = deserializeWithCache;
exports.globalDeserializeCache = globalDeserializeCache;
exports.globalSerializeCache = globalSerializeCache;
exports.serializeWithCache = serializeWithCache;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=serialization-cache.cjs.map
