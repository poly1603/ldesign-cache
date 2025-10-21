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
var evictionStrategies = require('../strategies/eviction-strategies.cjs');
var baseEngine = require('./base-engine.cjs');

class MemoryEngine extends baseEngine.BaseStorageEngine {
  /**
   * 构造函数
   *
   * @param config - 内存引擎配置选项
   */
  constructor(config) {
    super();
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "memory"
    });
    Object.defineProperty(this, "available", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: true
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxItems", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "evictionStrategy", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "storage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "cleanupTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "evictionCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "sizeCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "SIZE_CACHE_LIMIT", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: performance.CACHE_SIZE.SIZE_CACHE_LIMIT
    });
    this.maxSize = config?.maxSize || performance.ENGINE_CONFIG.MEMORY_MAX_SIZE_DEFAULT;
    this.maxItems = config?.maxItems || performance.ENGINE_CONFIG.MEMORY_MAX_ITEMS_DEFAULT;
    const strategyName = config?.evictionStrategy || "LRU";
    this.evictionStrategy = evictionStrategies.EvictionStrategyFactory.create(strategyName);
    const cleanupInterval = config?.cleanupInterval || 6e4;
    this.startCleanupTimer(cleanupInterval);
  }
  /**
   * 启动清理定时器
   *
   * 创建定期清理过期缓存项的定时器，兼容浏览器和Node.js环境
   *
   * @param interval - 清理间隔时间（毫秒）
   */
  startCleanupTimer(interval) {
    const setIntervalFn = typeof window !== "undefined" ? window.setInterval : globalThis.setInterval;
    this.cleanupTimer = setIntervalFn(() => {
      this.cleanup().catch((error) => {
        console.error("Memory engine cleanup failed:", error);
      });
    }, interval);
  }
  /**
   * 设置缓存项
   *
   * 将键值对存储到内存中，支持TTL过期时间和内存大小检查
   *
   * @param key - 缓存键
   * @param value - 缓存值（字符串格式）
   * @param ttl - 生存时间（毫秒），可选
   * @throws {Error} 当内存不足时抛出错误
   *
   * @example
   * ```typescript
   * // 设置永久缓存
   * await engine.setItem('user:123', JSON.stringify(userData))
   *
   * // 设置带TTL的缓存
   * await engine.setItem('session:abc', sessionData, 3600000) // 1小时
   * ```
   */
  async setItem(key, value, ttl) {
    const keySize = this.calculateSizeFast(key);
    const valueSize = this.calculateSizeFast(value);
    const dataSize = keySize + valueSize;
    if (this.storage.size >= this.maxItems && !this.storage.has(key)) {
      await this.evictByStrategy();
    }
    const isUpdate = this.storage.has(key);
    let oldSize = 0;
    if (isUpdate) {
      const oldItem = this.storage.get(key);
      oldSize = keySize + this.calculateSizeFast(oldItem.value);
    }
    const netSizeChange = dataSize - oldSize;
    if (!this.checkStorageSpace(netSizeChange)) {
      await this.cleanup();
      if (!this.checkStorageSpace(netSizeChange)) {
        await this.evictUntilSpaceAvailable(netSizeChange);
      }
    }
    const now = Date.now();
    const item = {
      value,
      createdAt: now,
      expiresAt: ttl ? now + ttl : void 0
    };
    this.storage.set(key, item);
    if (isUpdate) {
      this._usedSize = this._usedSize - oldSize + dataSize;
      this.evictionStrategy.recordAccess(key);
    } else {
      this._usedSize += dataSize;
      this.evictionStrategy.recordAdd(key, ttl);
    }
  }
  /**
   * 获取缓存项
   */
  async getItem(key) {
    const item = this.storage.get(key);
    if (!item) {
      return null;
    }
    if (item.expiresAt && Date.now() > item.expiresAt) {
      const itemSize = this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
      this.storage.delete(key);
      this.evictionStrategy.removeKey(key);
      this._usedSize -= itemSize;
      return null;
    }
    this.evictionStrategy.recordAccess(key);
    return item.value;
  }
  /**
   * 获取缓存项（别名，用于测试兼容）
   */
  async get(key) {
    return this.getItem(key);
  }
  /**
   * 设置缓存项（别名，用于测试兼容）
   */
  async set(key, value, options = {}) {
    return this.setItem(key, value, options.ttl);
  }
  /**
   * 删除缓存项
   */
  async removeItem(key) {
    const item = this.storage.get(key);
    if (item) {
      const itemSize = this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
      this._usedSize -= itemSize;
    }
    this.storage.delete(key);
    this.evictionStrategy.removeKey(key);
  }
  /**
   * 清空所有缓存项
   */
  async clear() {
    this.storage.clear();
    this.evictionStrategy.clear();
    this._usedSize = 0;
  }
  /**
   * 获取所有键名
   */
  async keys() {
    return Array.from(this.storage.keys());
  }
  /**
   * 检查键是否存在
   */
  async hasItem(key) {
    return this.storage.has(key);
  }
  /**
   * 获取缓存项数量
   */
  async length() {
    return this.storage.size;
  }
  /**
   * 清理过期项
   */
  async cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    let freedSize = 0;
    for (const [key, item] of this.storage) {
      if (item.expiresAt && now > item.expiresAt) {
        keysToDelete.push(key);
        freedSize += this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
      }
    }
    for (const key of keysToDelete) {
      this.storage.delete(key);
      this.evictionStrategy.removeKey(key);
    }
    if (keysToDelete.length > 0) {
      this._usedSize -= freedSize;
    }
  }
  /**
   * 快速计算字符串大小（字节）
   * 优化版本：
   * 1. 使用LRU缓存避免重复计算相同字符串
   * 2. 使用更高效的UTF-8字节计算
   *
   * UTF-8编码规则：
   * - ASCII字符（0-127）：1字节
   * - 其他字符：平均3字节（简化估算）
   */
  calculateSizeFast(str) {
    const cached = this.sizeCache.get(str);
    if (cached !== void 0) {
      return cached;
    }
    let size = 0;
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const code = str.charCodeAt(i);
      size += code < performance.UTF8_SIZE.ASCII_MAX ? performance.UTF8_SIZE.ONE_BYTE : code < performance.UTF8_SIZE.TWO_BYTE_MAX ? performance.UTF8_SIZE.TWO_BYTES : code < performance.UTF8_SIZE.THREE_BYTE_MAX ? performance.UTF8_SIZE.THREE_BYTES : performance.UTF8_SIZE.FOUR_BYTES;
    }
    if (this.sizeCache.size >= this.SIZE_CACHE_LIMIT) {
      const firstKey = this.sizeCache.keys().next().value;
      if (firstKey !== void 0) {
        this.sizeCache.delete(firstKey);
      }
    }
    this.sizeCache.set(str, size);
    return size;
  }
  /**
   * 根据策略淘汰一个项
   */
  async evictByStrategy() {
    const keyToEvict = this.evictionStrategy.getEvictionKey();
    if (keyToEvict && this.storage.has(keyToEvict)) {
      const item = this.storage.get(keyToEvict);
      const itemSize = this.calculateSizeFast(keyToEvict) + this.calculateSizeFast(item.value);
      this.storage.delete(keyToEvict);
      this.evictionStrategy.removeKey(keyToEvict);
      this.evictionCount++;
      this._usedSize -= itemSize;
    }
  }
  /**
   * 淘汰项直到有足够空间
   */
  async evictUntilSpaceAvailable(requiredSpace) {
    let freedSpace = 0;
    const maxEvictions = Math.min(this.storage.size, Math.ceil(this.storage.size * performance.MEMORY_CONFIG.MAX_EVICTION_RATIO));
    let evictionCount = 0;
    while (freedSpace < requiredSpace && evictionCount < maxEvictions) {
      const keyToEvict = this.evictionStrategy.getEvictionKey();
      if (!keyToEvict || !this.storage.has(keyToEvict)) {
        await this.evictOldestItems(requiredSpace - freedSpace);
        break;
      }
      const item = this.storage.get(keyToEvict);
      const itemSize = this.calculateSizeFast(keyToEvict) + this.calculateSizeFast(item.value);
      this.storage.delete(keyToEvict);
      this.evictionStrategy.removeKey(keyToEvict);
      this.evictionCount++;
      this._usedSize -= itemSize;
      freedSpace += itemSize;
      evictionCount++;
    }
  }
  /**
   * 清理最旧的项以释放空间
   */
  async evictOldestItems(requiredSpace) {
    const items = Array.from(this.storage.entries()).sort(([, a], [, b]) => a.createdAt - b.createdAt);
    let freedSpace = 0;
    const keysToDelete = [];
    for (const [key, item] of items) {
      const itemSize = this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
      keysToDelete.push(key);
      freedSpace += itemSize;
      if (freedSpace >= requiredSpace && keysToDelete.length > 0) {
        break;
      }
    }
    if (freedSpace < requiredSpace && keysToDelete.length < items.length) {
      const halfLength = Math.ceil(items.length * performance.MEMORY_CONFIG.HALF_EVICTION_RATIO);
      for (let i = keysToDelete.length; i < halfLength; i++) {
        if (items[i]) {
          const [key, item] = items[i];
          keysToDelete.push(key);
          freedSpace += this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
        }
      }
    }
    for (const key of keysToDelete) {
      this.storage.delete(key);
      this.evictionStrategy.removeKey(key);
    }
    this._usedSize -= freedSpace;
  }
  /**
   * 更新使用大小（完整重新计算）
   * 注意：此方法现在主要用于初始化或校验，日常操作使用增量更新
   */
  async updateUsedSize() {
    let totalSize = 0;
    for (const [key, item] of this.storage) {
      totalSize += this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
    }
    this._usedSize = totalSize;
  }
  /**
   * 获取缓存项详细信息
   */
  async getItemInfo(key) {
    return this.storage.get(key) || null;
  }
  /**
   * 获取所有缓存项（用于调试）
   */
  async getAllItems() {
    const result = {};
    for (const [key, item] of this.storage) {
      result[key] = {
        ...item
      };
    }
    return result;
  }
  /**
   * 设置淘汰策略
   */
  setEvictionStrategy(strategyName) {
    const newStrategy = evictionStrategies.EvictionStrategyFactory.create(strategyName);
    for (const [key, item] of this.storage) {
      const ttl = item.expiresAt ? item.expiresAt - Date.now() : void 0;
      newStrategy.recordAdd(key, ttl);
    }
    this.evictionStrategy = newStrategy;
  }
  /**
   * 获取淘汰统计
   */
  getEvictionStats() {
    return {
      totalEvictions: this.evictionCount || 0,
      strategy: this.evictionStrategy.name,
      strategyStats: this.evictionStrategy.getStats()
    };
  }
  /**
   * 获取存储统计
   */
  async getStorageStats() {
    const now = Date.now();
    let expiredItems = 0;
    let oldestTime = Infinity;
    let newestTime = 0;
    let oldestKey = "";
    let newestKey = "";
    for (const [key, item] of this.storage) {
      if (item.expiresAt && now > item.expiresAt) {
        expiredItems++;
      }
      if (item.createdAt < oldestTime) {
        oldestTime = item.createdAt;
        oldestKey = key;
      }
      if (item.createdAt > newestTime) {
        newestTime = item.createdAt;
        newestKey = key;
      }
    }
    return {
      totalItems: this.storage.size,
      totalSize: this._usedSize,
      expiredItems,
      oldestItem: oldestKey ? {
        key: oldestKey,
        age: now - oldestTime
      } : void 0,
      newestItem: newestKey ? {
        key: newestKey,
        age: now - newestTime
      } : void 0
    };
  }
  /**
   * 批量设置缓存项（优化版本）
   *
   * @param items - 要设置的键值对数组
   * @returns 设置结果数组
   */
  async batchSet(items) {
    const results = [];
    const now = Date.now();
    for (const {
      key,
      value,
      ttl
    } of items) {
      try {
        const keySize = this.calculateSizeFast(key);
        const valueSize = this.calculateSizeFast(value);
        const dataSize = keySize + valueSize;
        if (this.storage.size >= this.maxItems && !this.storage.has(key)) {
          await this.evictByStrategy();
        }
        const isUpdate = this.storage.has(key);
        let oldSize = 0;
        if (isUpdate) {
          const oldItem = this.storage.get(key);
          oldSize = keySize + this.calculateSizeFast(oldItem.value);
        }
        const netSizeChange = dataSize - oldSize;
        if (!this.checkStorageSpace(netSizeChange)) {
          await this.cleanup();
          if (!this.checkStorageSpace(netSizeChange)) {
            await this.evictUntilSpaceAvailable(netSizeChange);
          }
        }
        const item = {
          value,
          createdAt: now,
          expiresAt: ttl ? now + ttl : void 0
        };
        this.storage.set(key, item);
        if (isUpdate) {
          this._usedSize = this._usedSize - oldSize + dataSize;
          this.evictionStrategy.recordAccess(key);
        } else {
          this._usedSize += dataSize;
          this.evictionStrategy.recordAdd(key, ttl);
        }
        results.push(true);
      } catch (error) {
        console.error(`Failed to set ${key}:`, error);
        results.push(false);
      }
    }
    return results;
  }
  /**
   * 批量获取缓存项（优化版本）
   *
   * @param keys - 要获取的键数组
   * @returns 值数组（未找到的为 null）
   */
  async batchGet(keys) {
    const results = [];
    const now = Date.now();
    const expiredKeys = [];
    let expiredSize = 0;
    for (const key of keys) {
      const item = this.storage.get(key);
      if (!item) {
        results.push(null);
        continue;
      }
      if (item.expiresAt && now > item.expiresAt) {
        expiredKeys.push(key);
        expiredSize += this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
        results.push(null);
        continue;
      }
      this.evictionStrategy.recordAccess(key);
      results.push(item.value);
    }
    if (expiredKeys.length > 0) {
      for (const key of expiredKeys) {
        this.storage.delete(key);
        this.evictionStrategy.removeKey(key);
      }
      this._usedSize -= expiredSize;
    }
    return results;
  }
  /**
   * 批量删除缓存项（优化版本）
   *
   * @param keys - 要删除的键数组
   * @returns 删除结果数组
   */
  async batchRemove(keys) {
    const results = [];
    let totalFreedSize = 0;
    for (const key of keys) {
      const item = this.storage.get(key);
      if (item) {
        const itemSize = this.calculateSizeFast(key) + this.calculateSizeFast(item.value);
        totalFreedSize += itemSize;
        this.storage.delete(key);
        this.evictionStrategy.removeKey(key);
        results.push(true);
      } else {
        results.push(false);
      }
    }
    if (totalFreedSize > 0) {
      this._usedSize -= totalFreedSize;
    }
    return results;
  }
  /**
   * 批量检查键是否存在（优化版本）
   *
   * @param keys - 要检查的键数组
   * @returns 存在性检查结果数组
   */
  async batchHas(keys) {
    return keys.map((key) => this.storage.has(key));
  }
  /**
   * 销毁引擎
   */
  async destroy() {
    if (this.cleanupTimer) {
      const clearIntervalFn = typeof window !== "undefined" ? window.clearInterval : globalThis.clearInterval;
      clearIntervalFn(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    this.storage.clear();
    this.evictionStrategy.clear();
    this.sizeCache.clear();
    this._usedSize = 0;
  }
}

exports.MemoryEngine = MemoryEngine;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=memory-engine.cjs.map
