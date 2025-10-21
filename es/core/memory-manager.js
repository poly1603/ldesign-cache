/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import { TIME_INTERVALS, MEMORY_CONFIG, DATA_SIZE, UTF8_SIZE } from '../constants/performance.js';

class ObjectPool {
  constructor(factory, reset, maxSize = 100) {
    Object.defineProperty(this, "pool", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "factory", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "reset", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }
  acquire() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }
  release(obj) {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
  clear() {
    this.pool = [];
  }
  get size() {
    return this.pool.length;
  }
}
class MemoryManager {
  constructor(config = {}) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "currentUsage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "engineUsage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "itemCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "cleanupCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "lastCleanupTime", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "cleanupTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "metadataPool", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "cacheItemPool", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "objectSizeCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new WeakMap()
    });
    Object.defineProperty(this, "pressureCallbacks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    this.config = {
      maxMemory: config.maxMemory || MEMORY_CONFIG.MAX_DEFAULT,
      highPressureThreshold: config.highPressureThreshold || MEMORY_CONFIG.HIGH_PRESSURE_THRESHOLD,
      criticalPressureThreshold: config.criticalPressureThreshold || MEMORY_CONFIG.CRITICAL_PRESSURE_THRESHOLD,
      autoCleanupInterval: config.autoCleanupInterval || TIME_INTERVALS.CLEANUP_INTERVAL_DEFAULT,
      enableAutoPressureResponse: config.enableAutoPressureResponse ?? true
    };
    this.metadataPool = new ObjectPool(() => ({}), (obj) => {
      for (const key in obj) {
        delete obj[key];
      }
    });
    this.cacheItemPool = new ObjectPool(() => ({
      value: null,
      metadata: null
    }), (obj) => {
      obj.value = null;
      obj.metadata = null;
    });
    if (this.config.autoCleanupInterval > 0) {
      this.startAutoCleanup();
    }
  }
  /**
   * 更新内存使用量
   */
  updateUsage(delta, engine) {
    this.currentUsage = Math.max(0, this.currentUsage + delta);
    if (engine) {
      const current = this.engineUsage.get(engine) || 0;
      this.engineUsage.set(engine, Math.max(0, current + delta));
    }
    if (this.config.enableAutoPressureResponse) {
      this.checkMemoryPressure();
    }
  }
  /**
   * 更新项目计数
   */
  updateItemCount(delta) {
    this.itemCount = Math.max(0, this.itemCount + delta);
  }
  /**
   * 获取内存统计
   */
  getStats() {
    const usagePercentage = this.currentUsage / this.config.maxMemory;
    return {
      totalUsed: this.currentUsage,
      limit: this.config.maxMemory,
      usagePercentage,
      engineUsage: new Map(this.engineUsage),
      itemCount: this.itemCount,
      pressureLevel: this.getPressureLevel(usagePercentage),
      lastCleanupTime: this.lastCleanupTime,
      cleanupCount: this.cleanupCount
    };
  }
  /**
   * 获取压力级别
   */
  getPressureLevel(usagePercentage) {
    if (usagePercentage >= this.config.criticalPressureThreshold) {
      return "critical";
    }
    if (usagePercentage >= this.config.highPressureThreshold) {
      return "high";
    }
    if (usagePercentage >= MEMORY_CONFIG.MEDIUM_PRESSURE_THRESHOLD) {
      return "medium";
    }
    return "low";
  }
  /**
   * 检查内存压力并触发响应
   */
  checkMemoryPressure() {
    const stats = this.getStats();
    this.pressureCallbacks.forEach((callback) => {
      try {
        callback(stats.pressureLevel);
      } catch (error) {
        console.error("Memory pressure callback error:", error);
      }
    });
    if (stats.pressureLevel === "critical") {
      this.emergencyCleanup();
    } else if (stats.pressureLevel === "high" && Date.now() - this.lastCleanupTime > TIME_INTERVALS.HIGH_PRESSURE_CLEANUP_INTERVAL) {
      this.performCleanup();
    }
  }
  /**
   * 执行清理
   */
  performCleanup() {
    this.lastCleanupTime = Date.now();
    this.cleanupCount++;
    if (this.metadataPool.size > MEMORY_CONFIG.POOL_CLEANUP_THRESHOLD) {
      this.metadataPool.clear();
    }
    if (this.cacheItemPool.size > MEMORY_CONFIG.POOL_CLEANUP_THRESHOLD) {
      this.cacheItemPool.clear();
    }
    if (typeof globalThis !== "undefined" && globalThis.gc) {
      try {
        globalThis.gc();
      } catch {
      }
    }
  }
  /**
   * 紧急清理
   */
  emergencyCleanup() {
    console.warn("[MemoryManager] Emergency cleanup triggered due to critical memory pressure");
    this.metadataPool.clear();
    this.cacheItemPool.clear();
    this.performCleanup();
  }
  /**
   * 启动自动清理
   */
  startAutoCleanup() {
    const interval = this.config.autoCleanupInterval;
    const setIntervalFn = typeof window !== "undefined" ? window.setInterval : globalThis.setInterval;
    this.cleanupTimer = setIntervalFn(() => {
      const stats = this.getStats();
      if (stats.pressureLevel !== "low") {
        this.performCleanup();
      }
    }, interval);
  }
  /**
   * 计算对象大小（优化版）
   */
  calculateObjectSize(obj) {
    if (obj === null || obj === void 0) return DATA_SIZE.NULL_SIZE;
    if (typeof obj === "boolean") return DATA_SIZE.BOOLEAN_SIZE;
    if (typeof obj === "number") return DATA_SIZE.NUMBER_SIZE;
    if (typeof obj === "string") return this.calculateStringSize(obj);
    if (typeof obj === "object") {
      const cached = this.objectSizeCache.get(obj);
      if (cached !== void 0) return cached;
      let size = 0;
      if (Array.isArray(obj)) {
        size = DATA_SIZE.ARRAY_OVERHEAD;
        for (const item of obj) {
          size += this.calculateObjectSize(item);
        }
      } else {
        size = DATA_SIZE.OBJECT_OVERHEAD;
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            size += this.calculateStringSize(key);
            size += this.calculateObjectSize(obj[key]);
          }
        }
      }
      this.objectSizeCache.set(obj, size);
      return size;
    }
    return DATA_SIZE.NUMBER_SIZE;
  }
  /**
   * 计算字符串大小（UTF-8）优化版本
   */
  calculateStringSize(str) {
    let size = DATA_SIZE.STRING_OVERHEAD;
    const len = str.length;
    for (let i = 0; i < len; i++) {
      const code = str.charCodeAt(i);
      size += code < UTF8_SIZE.ASCII_MAX ? UTF8_SIZE.ONE_BYTE : code < UTF8_SIZE.TWO_BYTE_MAX ? UTF8_SIZE.TWO_BYTES : code < UTF8_SIZE.THREE_BYTE_MAX ? UTF8_SIZE.THREE_BYTES : UTF8_SIZE.FOUR_BYTES;
    }
    return size;
  }
  /**
   * 注册压力监听器
   */
  onPressure(callback) {
    this.pressureCallbacks.add(callback);
    return () => this.pressureCallbacks.delete(callback);
  }
  /**
   * 获取对象池中的元数据对象
   */
  acquireMetadata() {
    return this.metadataPool.acquire();
  }
  /**
   * 释放元数据对象到池中
   */
  releaseMetadata(obj) {
    this.metadataPool.release(obj);
  }
  /**
   * 获取对象池中的缓存项对象
   */
  acquireCacheItem() {
    return this.cacheItemPool.acquire();
  }
  /**
   * 释放缓存项对象到池中
   */
  releaseCacheItem(obj) {
    this.cacheItemPool.release(obj);
  }
  /**
   * 检查是否有足够的内存
   */
  hasEnoughMemory(required) {
    return this.currentUsage + required <= this.config.maxMemory;
  }
  /**
   * 请求内存分配
   */
  requestMemory(size) {
    if (this.hasEnoughMemory(size)) {
      return true;
    }
    this.performCleanup();
    return this.hasEnoughMemory(size);
  }
  /**
   * 重置内存统计
   */
  reset() {
    this.currentUsage = 0;
    this.engineUsage.clear();
    this.itemCount = 0;
    this.cleanupCount = 0;
    this.lastCleanupTime = 0;
  }
  /**
   * 销毁管理器
   */
  destroy() {
    if (this.cleanupTimer) {
      const clearIntervalFn = typeof window !== "undefined" ? window.clearInterval : globalThis.clearInterval;
      clearIntervalFn(this.cleanupTimer);
      this.cleanupTimer = void 0;
    }
    this.metadataPool.clear();
    this.cacheItemPool.clear();
    this.pressureCallbacks.clear();
    this.engineUsage.clear();
  }
}
function createMemoryManager(config) {
  return new MemoryManager(config);
}

export { MemoryManager, createMemoryManager };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=memory-manager.js.map
