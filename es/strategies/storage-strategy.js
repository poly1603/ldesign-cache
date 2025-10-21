/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class StorageStrategy {
  constructor(config) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "strategyCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "maxCacheSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 1e3
    });
    Object.defineProperty(this, "cacheHits", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "cacheMisses", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "engineWeights", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.config = {
      enabled: config?.enabled ?? true,
      sizeThresholds: {
        small: 1024,
        // 1KB
        medium: 64 * 1024,
        // 64KB
        large: 1024 * 1024,
        // 1MB
        ...config?.sizeThresholds
      },
      ttlThresholds: {
        short: 5 * 60 * 1e3,
        // 5分钟
        medium: 24 * 60 * 60 * 1e3,
        // 24小时
        long: 7 * 24 * 60 * 60 * 1e3,
        // 7天
        ...config?.ttlThresholds
      },
      enginePriority: config?.enginePriority || ["localStorage", "sessionStorage", "indexedDB", "memory", "cookie"]
    };
    this.engineWeights = this.precomputeEngineWeights();
  }
  /**
   * 预计算引擎优先级权重
   *
   * 性能优化：避免每次计算时重复计算权重
   */
  precomputeEngineWeights() {
    const weights = {
      localStorage: 0,
      sessionStorage: 0,
      cookie: 0,
      indexedDB: 0,
      memory: 0
    };
    this.config?.enginePriority.forEach((engine, index) => {
      const priorityScore = (this.config?.enginePriority.length - index) / this.config?.enginePriority.length;
      weights[engine] = 0.05 * priorityScore;
    });
    return weights;
  }
  /**
   * 生成缓存键
   *
   * 基于数据特征生成缓存键，用于策略结果缓存
   */
  generateCacheKey(dataSize, ttl, dataType) {
    return `${dataSize}:${ttl || 0}:${dataType}`;
  }
  /**
   * 选择最适合的存储引擎
   *
   * 优化版本：包含结果缓存和快速路径
   */
  async selectEngine(key, value, options) {
    if (!this.config?.enabled) {
      return {
        engine: this.config?.enginePriority[0],
        reason: "Strategy disabled, using default engine",
        confidence: 0.5
      };
    }
    const dataType = this.getDataType(value);
    const dataSize = this.fastCalculateDataSize(value, dataType);
    const ttl = options?.ttl;
    const cacheKey = this.generateCacheKey(dataSize, ttl, dataType);
    const cachedResult = this.strategyCache.get(cacheKey);
    if (cachedResult) {
      this.cacheHits++;
      return {
        ...cachedResult
      };
    }
    this.cacheMisses++;
    const quickResult = this.tryQuickPath(dataSize, ttl, dataType);
    if (quickResult) {
      this.cacheResult(cacheKey, quickResult);
      return quickResult;
    }
    const result = this.calculateFullStrategy(dataSize, ttl, dataType);
    this.cacheResult(cacheKey, result);
    return result;
  }
  /**
   * 快速计算数据大小
   *
   * 性能优化：根据数据类型使用不同的计算策略
   */
  fastCalculateDataSize(value, dataType) {
    if (value === null || value === void 0) {
      return 4;
    }
    switch (dataType) {
      case "string":
        return value.length * 2;
      // 估算UTF-16编码
      case "number":
        return 8;
      // 64位数字
      case "boolean":
        return 1;
      case "object":
      case "array":
        return this.estimateObjectSize(value);
      default:
        return JSON.stringify(value).length * 2;
    }
  }
  /**
   * 估算对象大小
   *
   * 性能优化：避免完整序列化，使用启发式方法
   */
  estimateObjectSize(obj) {
    if (obj === null || obj === void 0) {
      return 0;
    }
    const visited = /* @__PURE__ */ new WeakSet();
    const estimate = (value, depth = 0) => {
      if (depth > 10 || typeof value === "object" && value !== null && visited.has(value)) {
        return 100;
      }
      if (typeof value === "object" && value !== null) {
        visited.add(value);
      }
      switch (typeof value) {
        case "string":
          return value.length * 2;
        case "number":
          return 8;
        case "boolean":
          return 1;
        case "object":
          if (value === null) {
            return 0;
          }
          if (Array.isArray(value)) {
            return value.reduce((acc, item) => acc + estimate(item, depth + 1), 0);
          }
          return Object.keys(value).reduce((acc, key) => {
            return acc + key.length * 2 + estimate(value[key], depth + 1);
          }, 0);
        default:
          return 50;
      }
    };
    return estimate(obj);
  }
  /**
   * 快速路径检查
   *
   * 性能优化：处理常见情况，避免复杂计算
   */
  tryQuickPath(dataSize, ttl, dataType) {
    if (dataSize > this.config?.sizeThresholds.large) {
      return {
        engine: "indexedDB",
        reason: "Large data size requires IndexedDB",
        confidence: 0.9
      };
    }
    if (ttl && ttl < 5e3) {
      return {
        engine: "memory",
        reason: "Very short TTL, using memory for best performance",
        confidence: 0.95
      };
    }
    if (dataSize > 4096) {
      return null;
    }
    if (dataSize <= this.config?.sizeThresholds.small && (dataType === "string" || dataType === "number" || dataType === "boolean")) {
      return {
        engine: "localStorage",
        reason: "Small simple data, localStorage is optimal",
        confidence: 0.8
      };
    }
    return null;
  }
  /**
   * 缓存策略结果
   *
   * 性能优化：LRU缓存管理
   */
  cacheResult(cacheKey, result) {
    if (this.strategyCache.size >= this.maxCacheSize) {
      const firstKey = this.strategyCache.keys().next().value;
      if (firstKey) {
        this.strategyCache.delete(firstKey);
      }
    }
    this.strategyCache.set(cacheKey, {
      ...result
    });
  }
  /**
   * 获取缓存统计信息
   *
   * 用于性能监控
   */
  getCacheStats() {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      cacheSize: this.strategyCache.size
    };
  }
  /**
   * 基于数据大小选择引擎
   */
  selectBySize(size) {
    const {
      sizeThresholds
    } = this.config;
    if (size <= sizeThresholds.small) {
      return "localStorage";
    } else if (size <= sizeThresholds.medium) {
      return "sessionStorage";
    } else if (size <= sizeThresholds.large) {
      return "indexedDB";
    } else {
      return "indexedDB";
    }
  }
  /**
   * 基于TTL选择引擎
   */
  selectByTTL(ttl) {
    if (!ttl) {
      return "localStorage";
    }
    const {
      ttlThresholds
    } = this.config;
    if (ttl <= ttlThresholds.short) {
      return "memory";
    } else if (ttl <= ttlThresholds.medium) {
      return "sessionStorage";
    } else {
      return "localStorage";
    }
  }
  /**
   * 基于数据类型选择引擎
   */
  selectByDataType(dataType) {
    switch (dataType) {
      case "string":
      case "number":
      case "boolean":
        return "localStorage";
      // 简单类型优先使用 localStorage
      case "object":
      case "array":
        return "indexedDB";
      // 复杂对象使用 IndexedDB
      case "binary":
        return "indexedDB";
      // 二进制数据使用 IndexedDB
      default:
        return "localStorage";
    }
  }
  /**
   * 完整策略计算
   *
   * 当快速路径无法处理时使用的完整计算逻辑
   */
  calculateFullStrategy(dataSize, ttl, dataType) {
    const sizeBasedEngine = this.selectBySize(dataSize);
    const ttlBasedEngine = this.selectByTTL(ttl);
    const typeBasedEngine = this.selectByDataType(dataType);
    const scores = this.calculateEngineScores({
      sizeBasedEngine,
      ttlBasedEngine,
      typeBasedEngine,
      dataSize,
      ttl,
      dataType
    });
    return this.getBestEngine(scores);
  }
  /**
   * 计算各引擎得分
   *
   * 性能优化：使用预计算的权重
   */
  calculateEngineScores(factors) {
    const scores = {
      ...this.engineWeights
    };
    scores[factors.ttlBasedEngine] += 0.5;
    scores[factors.sizeBasedEngine] += 0.3;
    scores[factors.typeBasedEngine] += 0.15;
    this.applySpecialRules(scores, factors);
    return scores;
  }
  /**
   * 应用特殊规则
   */
  applySpecialRules(scores, factors) {
    if (factors.dataSize > 4 * 1024) {
      scores.cookie = 0;
    }
    if (factors.dataType === "binary") {
      scores.cookie = 0;
    }
    if (factors.ttl && factors.ttl < 5e3) {
      scores.memory += 0.8;
      scores.localStorage -= 0.3;
      scores.sessionStorage -= 0.3;
    }
    if (factors.dataSize > 100 * 1024) {
      scores.indexedDB += 0.5;
      scores.localStorage -= 0.3;
      scores.sessionStorage -= 0.3;
    }
    if (factors.dataType === "object" || factors.dataType === "array") {
      scores.indexedDB += 0.6;
      scores.localStorage -= 0.4;
      scores.sessionStorage -= 0.2;
    }
  }
  /**
   * 获取最佳引擎
   */
  getBestEngine(scores) {
    let bestEngine = "localStorage";
    let bestScore = 0;
    for (const [engine, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestEngine = engine;
      }
    }
    const reason = this.generateReason(bestEngine, scores);
    const confidence = Math.min(bestScore, 1);
    return {
      engine: bestEngine,
      reason,
      confidence
    };
  }
  /**
   * 生成选择原因
   */
  generateReason(engine, scores) {
    const score = scores[engine];
    switch (engine) {
      case "localStorage":
        return `\u9009\u62E9 localStorage\uFF1A\u9002\u5408\u6301\u4E45\u5316\u5B58\u50A8\u4E2D\u5C0F\u578B\u6570\u636E (\u5F97\u5206: ${score.toFixed(2)})`;
      case "sessionStorage":
        return `\u9009\u62E9 sessionStorage\uFF1A\u9002\u5408\u4F1A\u8BDD\u7EA7\u5B58\u50A8\u4E2D\u7B49\u5927\u5C0F\u6570\u636E (\u5F97\u5206: ${score.toFixed(2)})`;
      case "cookie":
        return `\u9009\u62E9 Cookie\uFF1A\u9002\u5408\u9700\u8981\u670D\u52A1\u5668\u4EA4\u4E92\u7684\u5C0F\u6570\u636E (\u5F97\u5206: ${score.toFixed(2)})`;
      case "indexedDB":
        return `\u9009\u62E9 IndexedDB\uFF1A\u9002\u5408\u5927\u91CF\u7ED3\u6784\u5316\u6570\u636E\u5B58\u50A8 (\u5F97\u5206: ${score.toFixed(2)})`;
      case "memory":
        return `\u9009\u62E9\u5185\u5B58\u7F13\u5B58\uFF1A\u9002\u5408\u4E34\u65F6\u9AD8\u9891\u8BBF\u95EE\u6570\u636E (\u5F97\u5206: ${score.toFixed(2)})`;
      default:
        return `\u9009\u62E9 ${engine} (\u5F97\u5206: ${score.toFixed(2)})`;
    }
  }
  /**
   * 获取数据类型
   */
  getDataType(value) {
    if (value === null || value === void 0) {
      return "string";
    }
    if (typeof value === "string") {
      return "string";
    }
    if (typeof value === "number") {
      return "number";
    }
    if (typeof value === "boolean") {
      return "boolean";
    }
    if (Array.isArray(value)) {
      return "array";
    }
    if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
      return "binary";
    }
    return "object";
  }
  /**
   * 计算数据大小
   */
  calculateDataSize(value) {
    try {
      const serialized = JSON.stringify(value);
      return new Blob([serialized]).size;
    } catch {
      return 0;
    }
  }
  /**
   * 更新策略配置
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      sizeThresholds: {
        ...this.config?.sizeThresholds,
        ...config.sizeThresholds
      },
      ttlThresholds: {
        ...this.config?.ttlThresholds,
        ...config.ttlThresholds
      }
    };
  }
  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      ...this.config
    };
  }
}

export { StorageStrategy };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=storage-strategy.js.map
