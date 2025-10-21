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

class LRUNode {
  constructor(key, prev = null, next = null) {
    Object.defineProperty(this, "key", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: key
    });
    Object.defineProperty(this, "prev", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: prev
    });
    Object.defineProperty(this, "next", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: next
    });
  }
}
class LRUStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "LRU"
    });
    Object.defineProperty(this, "nodeMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "head", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "tail", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
  }
  recordAccess(key) {
    const node = this.nodeMap.get(key);
    if (node) {
      this.moveToHead(node);
    }
  }
  recordAdd(key) {
    if (this.nodeMap.has(key)) {
      this.recordAccess(key);
      return;
    }
    const node = new LRUNode(key);
    this.nodeMap.set(key, node);
    this.addToHead(node);
  }
  getEvictionKey() {
    return this.tail?.key ?? null;
  }
  removeKey(key) {
    const node = this.nodeMap.get(key);
    if (node) {
      this.removeNode(node);
      this.nodeMap.delete(key);
    }
  }
  clear() {
    this.nodeMap.clear();
    this.head = null;
    this.tail = null;
  }
  getStats() {
    return {
      totalKeys: this.nodeMap.size,
      headKey: this.head?.key,
      tailKey: this.tail?.key
    };
  }
  /**
   * 将节点移到头部
   */
  moveToHead(node) {
    if (node === this.head) {
      return;
    }
    this.removeNode(node);
    this.addToHead(node);
  }
  /**
   * 添加节点到头部
   */
  addToHead(node) {
    node.next = this.head;
    node.prev = null;
    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;
    if (!this.tail) {
      this.tail = node;
    }
  }
  /**
   * 从链表中移除节点
   */
  removeNode(node) {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }
}
class LFUStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "LFU"
    });
    Object.defineProperty(this, "frequencyMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "lastAccessTime", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  recordAccess(key) {
    const frequency = this.frequencyMap.get(key) || 0;
    this.frequencyMap.set(key, frequency + 1);
    this.lastAccessTime.set(key, Date.now());
  }
  recordAdd(key) {
    this.frequencyMap.set(key, 1);
    this.lastAccessTime.set(key, Date.now());
  }
  getEvictionKey() {
    if (this.frequencyMap.size === 0) {
      return null;
    }
    let evictionKey = null;
    let lowestFrequency = Infinity;
    let oldestTime = Infinity;
    for (const [key, frequency] of this.frequencyMap) {
      const accessTime = this.lastAccessTime.get(key) || 0;
      if (frequency < lowestFrequency || frequency === lowestFrequency && accessTime < oldestTime) {
        lowestFrequency = frequency;
        oldestTime = accessTime;
        evictionKey = key;
      }
    }
    return evictionKey;
  }
  removeKey(key) {
    this.frequencyMap.delete(key);
    this.lastAccessTime.delete(key);
  }
  clear() {
    this.frequencyMap.clear();
    this.lastAccessTime.clear();
  }
  getStats() {
    const frequencies = Array.from(this.frequencyMap.values());
    const avgFrequency = frequencies.length > 0 ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length : 0;
    return {
      totalKeys: this.frequencyMap.size,
      averageFrequency: avgFrequency,
      maxFrequency: Math.max(...frequencies, 0),
      minFrequency: Math.min(...frequencies, 0)
    };
  }
}
class FIFOStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "FIFO"
    });
    Object.defineProperty(this, "queue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
  }
  recordAccess(_key) {
  }
  recordAdd(key) {
    const index = this.queue.indexOf(key);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    this.queue.push(key);
  }
  getEvictionKey() {
    return this.queue.length > 0 ? this.queue[0] : null;
  }
  removeKey(key) {
    const index = this.queue.indexOf(key);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }
  clear() {
    this.queue = [];
  }
  getStats() {
    return {
      queueLength: this.queue.length,
      oldestKey: this.queue[0] || null,
      newestKey: this.queue[this.queue.length - 1] || null
    };
  }
}
class MRUStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "MRU"
    });
    Object.defineProperty(this, "accessOrder", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "counter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
  }
  recordAccess(key) {
    this.accessOrder.set(key, this.counter++);
  }
  recordAdd(key) {
    this.accessOrder.set(key, this.counter++);
  }
  getEvictionKey() {
    if (this.accessOrder.size === 0) {
      return null;
    }
    let newestKey = null;
    let newestTime = -1;
    for (const [key, time] of this.accessOrder) {
      if (time > newestTime) {
        newestTime = time;
        newestKey = key;
      }
    }
    return newestKey;
  }
  removeKey(key) {
    this.accessOrder.delete(key);
  }
  clear() {
    this.accessOrder.clear();
    this.counter = 0;
  }
  getStats() {
    return {
      totalKeys: this.accessOrder.size,
      accessCounter: this.counter
    };
  }
}
class RandomStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Random"
    });
    Object.defineProperty(this, "keys", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
  }
  recordAccess(_key) {
  }
  recordAdd(key) {
    this.keys.add(key);
  }
  getEvictionKey() {
    if (this.keys.size === 0) {
      return null;
    }
    const keysArray = Array.from(this.keys);
    const randomIndex = Math.floor(Math.random() * keysArray.length);
    return keysArray[randomIndex];
  }
  removeKey(key) {
    this.keys.delete(key);
  }
  clear() {
    this.keys.clear();
  }
  getStats() {
    return {
      totalKeys: this.keys.size
    };
  }
}
class TTLStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "TTL"
    });
    Object.defineProperty(this, "ttlMap", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
  }
  recordAccess(_key) {
  }
  recordAdd(key, ttl) {
    if (ttl) {
      this.ttlMap.set(key, Date.now() + ttl);
    }
  }
  getEvictionKey() {
    if (this.ttlMap.size === 0) {
      return null;
    }
    const now = Date.now();
    let soonestKey = null;
    let soonestExpiry = Infinity;
    for (const [key, expiry] of this.ttlMap) {
      if (expiry <= now) {
        return key;
      }
      if (expiry < soonestExpiry) {
        soonestExpiry = expiry;
        soonestKey = key;
      }
    }
    return soonestKey;
  }
  removeKey(key) {
    this.ttlMap.delete(key);
  }
  clear() {
    this.ttlMap.clear();
  }
  getStats() {
    const now = Date.now();
    const expired = Array.from(this.ttlMap.values()).filter((t) => t <= now).length;
    const ttls = Array.from(this.ttlMap.values()).map((t) => Math.max(0, t - now));
    const avgTTL = ttls.length > 0 ? ttls.reduce((a, b) => a + b, 0) / ttls.length : 0;
    return {
      totalKeys: this.ttlMap.size,
      expiredKeys: expired,
      averageTTL: avgTTL
    };
  }
}
class ARCStrategy {
  constructor() {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "ARC"
    });
    Object.defineProperty(this, "lru", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new LRUStrategy()
    });
    Object.defineProperty(this, "lfu", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new LFUStrategy()
    });
    Object.defineProperty(this, "adaptiveWeight", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0.5
    });
    Object.defineProperty(this, "hitCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "missCount", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
  }
  recordAccess(key) {
    this.lru.recordAccess(key);
    this.lfu.recordAccess(key);
    this.hitCount++;
    this.updateWeight();
  }
  recordAdd(key) {
    this.lru.recordAdd(key);
    this.lfu.recordAdd(key);
    this.missCount++;
    this.updateWeight();
  }
  updateWeight() {
    const total = this.hitCount + this.missCount;
    if (total > 100) {
      const hitRate = this.hitCount / total;
      if (hitRate > 0.8) {
        this.adaptiveWeight = Math.max(0.2, this.adaptiveWeight - 0.1);
      } else if (hitRate < 0.5) {
        this.adaptiveWeight = Math.min(0.8, this.adaptiveWeight + 0.1);
      }
      this.hitCount = 0;
      this.missCount = 0;
    }
  }
  getEvictionKey() {
    if (Math.random() < this.adaptiveWeight) {
      return this.lru.getEvictionKey();
    } else {
      return this.lfu.getEvictionKey();
    }
  }
  removeKey(key) {
    this.lru.removeKey(key);
    this.lfu.removeKey(key);
  }
  clear() {
    this.lru.clear();
    this.lfu.clear();
    this.hitCount = 0;
    this.missCount = 0;
    this.adaptiveWeight = 0.5;
  }
  getStats() {
    return {
      lruWeight: this.adaptiveWeight,
      lfuWeight: 1 - this.adaptiveWeight,
      hitCount: this.hitCount,
      missCount: this.missCount,
      lruStats: this.lru.getStats(),
      lfuStats: this.lfu.getStats()
    };
  }
}
class EvictionStrategyFactory {
  /**
   * 创建淘汰策略
   */
  static create(name) {
    const normalizedName = name.toUpperCase();
    const factory = this.strategies.get(normalizedName);
    if (!factory) {
      throw new Error(`Unknown eviction strategy: ${name}`);
    }
    return factory();
  }
  /**
   * 注册自定义策略
   */
  static register(name, factory) {
    this.strategies.set(name.toUpperCase(), factory);
  }
  /**
   * 获取所有可用策略名称
   */
  static getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }
}
Object.defineProperty(EvictionStrategyFactory, "strategies", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: /* @__PURE__ */ new Map([["LRU", () => new LRUStrategy()], ["LFU", () => new LFUStrategy()], ["FIFO", () => new FIFOStrategy()], ["MRU", () => new MRUStrategy()], ["RANDOM", () => new RandomStrategy()], ["TTL", () => new TTLStrategy()], ["ARC", () => new ARCStrategy()]])
});

exports.ARCStrategy = ARCStrategy;
exports.EvictionStrategyFactory = EvictionStrategyFactory;
exports.FIFOStrategy = FIFOStrategy;
exports.LFUStrategy = LFUStrategy;
exports.LRUStrategy = LRUStrategy;
exports.MRUStrategy = MRUStrategy;
exports.RandomStrategy = RandomStrategy;
exports.TTLStrategy = TTLStrategy;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=eviction-strategies.cjs.map
