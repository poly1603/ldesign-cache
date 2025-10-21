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

var cacheManager = require('./cache-manager.cjs');

exports.CachePriority = void 0;
(function(CachePriority2) {
  CachePriority2[CachePriority2["LOW"] = 0] = "LOW";
  CachePriority2[CachePriority2["MEDIUM"] = 1] = "MEDIUM";
  CachePriority2[CachePriority2["HIGH"] = 2] = "HIGH";
  CachePriority2[CachePriority2["CRITICAL"] = 3] = "CRITICAL";
})(exports.CachePriority || (exports.CachePriority = {}));
class TieredCacheManager {
  constructor(tiers) {
    Object.defineProperty(this, "tiers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "tierOrder", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    const sorted = [...tiers].sort((a, b) => a.priority - b.priority);
    for (const tier of sorted) {
      const manager = new cacheManager.CacheManager({
        defaultEngine: tier.engine,
        defaultTTL: tier.defaultTTL,
        maxMemory: tier.maxSize
      });
      this.tiers.set(tier.name, {
        config: tier,
        manager
      });
      this.tierOrder.push(tier.name);
    }
  }
  /**
   * 分层设置缓存
   */
  async set(key, value, options) {
    if (options?.tier) {
      const tier = this.tiers.get(options.tier);
      if (tier) {
        await tier.manager.set(key, value, options);
        return;
      }
    }
    const firstTier = this.tiers.get(this.tierOrder[0]);
    if (firstTier) {
      await firstTier.manager.set(key, value, options);
    }
  }
  /**
   * 分层获取缓存
   */
  async get(key) {
    for (const tierName of this.tierOrder) {
      const tier = this.tiers.get(tierName);
      if (!tier) continue;
      const value = await tier.manager.get(key);
      if (value !== null) {
        const currentIndex = this.tierOrder.indexOf(tierName);
        if (currentIndex > 0) {
          await this.promote(key, value, tierName, this.tierOrder[0]);
        }
        return value;
      }
    }
    return null;
  }
  /**
   * 提升缓存项到更高层级
   */
  async promote(key, value, fromTier, toTier) {
    const source = this.tiers.get(fromTier);
    const target = this.tiers.get(toTier);
    if (!source || !target) return;
    await target.manager.set(key, value, {
      ttl: 36e5
      // 默认1小时
    });
  }
  /**
   * 降级缓存项到更低层级
   */
  async demote(key, fromTier, toTier) {
    const source = this.tiers.get(fromTier);
    const target = this.tiers.get(toTier);
    if (!source || !target) return;
    const value = await source.manager.get(key);
    if (value !== null) {
      await target.manager.set(key, value);
      await source.manager.remove(key);
    }
  }
  /**
   * 获取所有层级的统计信息
   */
  async getStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [name, tier] of this.tiers) {
      stats.set(name, await tier.manager.getStats());
    }
    return stats;
  }
}
class PartitionedCacheManager {
  constructor(partitions, defaultConfig) {
    Object.defineProperty(this, "partitions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "partitionManagers", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "defaultManager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.defaultManager = new cacheManager.CacheManager(defaultConfig);
    for (const partition of partitions) {
      this.partitions.set(partition.name, partition);
      this.partitionManagers.set(partition.name, new cacheManager.CacheManager({
        keyPrefix: partition.name,
        maxItems: partition.maxItems
      }));
    }
  }
  /**
   * 根据键选择分区
   */
  selectPartition(key) {
    for (const [name, partition] of this.partitions) {
      if (typeof partition.keyPattern === "string") {
        if (key.startsWith(partition.keyPattern)) {
          return name;
        }
      } else if (partition.keyPattern instanceof RegExp) {
        if (partition.keyPattern.test(key)) {
          return name;
        }
      }
    }
    return null;
  }
  /**
   * 设置缓存（自动路由到分区）
   */
  async set(key, value, options) {
    const partitionName = this.selectPartition(key);
    const manager = partitionName ? this.partitionManagers.get(partitionName) || this.defaultManager : this.defaultManager;
    await manager.set(key, value, options);
  }
  /**
   * 获取缓存（自动路由到分区）
   */
  async get(key) {
    const partitionName = this.selectPartition(key);
    const manager = partitionName ? this.partitionManagers.get(partitionName) || this.defaultManager : this.defaultManager;
    return manager.get(key);
  }
  /**
   * 获取分区统计
   */
  async getPartitionStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [name, manager] of this.partitionManagers) {
      stats.set(name, await manager.getStats());
    }
    stats.set("default", await this.defaultManager.getStats());
    return stats;
  }
}
class PriorityCacheManager {
  constructor(config) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "priorities", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "priorityQueues", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    this.cache = new cacheManager.CacheManager(config);
    for (const priority of Object.values(exports.CachePriority)) {
      if (typeof priority === "number") {
        this.priorityQueues.set(priority, /* @__PURE__ */ new Set());
      }
    }
  }
  /**
   * 设置带优先级的缓存
   */
  async set(key, value, options) {
    const priority = options?.priority ?? exports.CachePriority.MEDIUM;
    this.priorities.set(key, priority);
    this.priorityQueues.get(priority)?.add(key);
    await this.cache.set(key, value, options);
  }
  /**
   * 获取缓存并更新访问频率
   */
  async get(key) {
    const value = await this.cache.get(key);
    if (value !== null) {
      const currentPriority = this.priorities.get(key);
      if (currentPriority !== void 0 && currentPriority < exports.CachePriority.CRITICAL) {
        await this.promotePriority(key);
      }
    }
    return value;
  }
  /**
   * 提升优先级
   */
  async promotePriority(key) {
    const current = this.priorities.get(key);
    if (current === void 0 || current >= exports.CachePriority.CRITICAL) return;
    this.priorityQueues.get(current)?.delete(key);
    const newPriority = current + 1;
    this.priorities.set(key, newPriority);
    this.priorityQueues.get(newPriority)?.add(key);
  }
  /**
   * 基于优先级的淘汰
   */
  async evictByPriority(count) {
    let evicted = 0;
    for (const priority of [exports.CachePriority.LOW, exports.CachePriority.MEDIUM, exports.CachePriority.HIGH]) {
      const queue = this.priorityQueues.get(priority);
      if (!queue) continue;
      for (const key of queue) {
        await this.cache.remove(key);
        queue.delete(key);
        this.priorities.delete(key);
        evicted++;
        if (evicted >= count) return;
      }
    }
  }
  /**
   * 获取优先级统计
   */
  getPriorityStats() {
    const stats = /* @__PURE__ */ new Map();
    for (const [priority, queue] of this.priorityQueues) {
      stats.set(priority, queue.size);
    }
    return stats;
  }
}
class CostAwareCacheManager {
  constructor(config) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "costs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "values", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    this.cache = new cacheManager.CacheManager(config);
  }
  /**
   * 设置带成本的缓存
   */
  async set(key, value, options) {
    if (options?.cost !== void 0) {
      this.costs.set(key, options.cost);
    }
    if (options?.value !== void 0) {
      this.values.set(key, options.value);
    }
    await this.cache.set(key, value, options);
  }
  /**
   * 基于价值/成本比的淘汰
   */
  async evictByValueCostRatio(count) {
    const ratios = [];
    for (const [key, cost] of this.costs) {
      const value = this.values.get(key) || 1;
      ratios.push({
        key,
        ratio: value / cost
      });
    }
    ratios.sort((a, b) => a.ratio - b.ratio);
    for (let i = 0; i < Math.min(count, ratios.length); i++) {
      const {
        key
      } = ratios[i];
      await this.cache.remove(key);
      this.costs.delete(key);
      this.values.delete(key);
    }
  }
}
function createAdvancedCacheManager(config) {
  switch (config.type) {
    case "tiered":
      if (!config.tiers) {
        throw new Error("Tiers configuration is required for tiered cache");
      }
      return new TieredCacheManager(config.tiers);
    case "partitioned":
      if (!config.partitions) {
        throw new Error("Partitions configuration is required for partitioned cache");
      }
      return new PartitionedCacheManager(config.partitions, config.options);
    case "priority":
      return new PriorityCacheManager(config.options);
    case "cost":
      return new CostAwareCacheManager(config.options);
    default:
      throw new Error(`Unknown cache type: ${config.type}`);
  }
}

exports.CostAwareCacheManager = CostAwareCacheManager;
exports.PartitionedCacheManager = PartitionedCacheManager;
exports.PriorityCacheManager = PriorityCacheManager;
exports.TieredCacheManager = TieredCacheManager;
exports.createAdvancedCacheManager = createAdvancedCacheManager;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=advanced-cache-manager.cjs.map
