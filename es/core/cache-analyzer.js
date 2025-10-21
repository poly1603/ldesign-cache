/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class CacheAnalyzer {
  constructor(cache, config = {}) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: cache
    });
    Object.defineProperty(this, "enabled", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "sampleRate", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "maxRecords", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "recordValues", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "accessRecords", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "performanceRecords", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "errorRecords", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "analysisTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "startTime", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: Date.now()
    });
    this.enabled = config.enabled ?? true;
    this.sampleRate = config.sampleRate ?? 1;
    this.maxRecords = config.maxRecords ?? 1e4;
    this.recordValues = config.recordValues ?? false;
    if (this.enabled) {
      this.attachListeners();
      this.startAnalysis(config.interval ?? 6e4);
    }
  }
  /**
   * 附加事件监听器
   */
  attachListeners() {
    this.cache.on("get", this.handleGet.bind(this));
    this.cache.on("set", this.handleSet.bind(this));
    this.cache.on("remove", this.handleRemove.bind(this));
    this.cache.on("error", this.handleError.bind(this));
  }
  /**
   * 处理 get 事件
   */
  handleGet(event) {
    if (!this.shouldSample()) {
      return;
    }
    const pattern = this.getOrCreatePattern(event.key);
    pattern.accessCount++;
    if (event.value !== null && event.value !== void 0) {
      pattern.hitCount++;
    } else {
      pattern.missCount++;
    }
    this.updateAccessTime(pattern);
    this.recordPerformance("get", event.timestamp);
  }
  /**
   * 处理 set 事件
   */
  handleSet(event) {
    if (!this.shouldSample()) {
      return;
    }
    const pattern = this.getOrCreatePattern(event.key);
    pattern.engine = event.engine;
    if (event.value !== null && event.value !== void 0 && this.recordValues) {
      try {
        pattern.size = new Blob([JSON.stringify(event.value)]).size;
      } catch {
      }
    }
    this.recordPerformance("set", event.timestamp);
  }
  /**
   * 处理 remove 事件
   */
  handleRemove(event) {
    if (!this.shouldSample()) {
      return;
    }
    this.recordPerformance("remove", event.timestamp);
  }
  /**
   * 处理错误事件
   */
  handleError(event) {
    if (event.error) {
      this.errorRecords.push({
        time: event.timestamp,
        operation: event.type,
        error: event.error
      });
      if (this.errorRecords.length > 1e3) {
        this.errorRecords = this.errorRecords.slice(-500);
      }
    }
  }
  /**
   * 是否应该采样
   */
  shouldSample() {
    return this.enabled && Math.random() < this.sampleRate;
  }
  /**
   * 获取或创建访问模式
   */
  getOrCreatePattern(key) {
    let pattern = this.accessRecords.get(key);
    if (!pattern) {
      pattern = {
        key,
        accessCount: 0,
        hitCount: 0,
        missCount: 0,
        avgInterval: 0,
        lastAccess: Date.now()
      };
      this.accessRecords.set(key, pattern);
      if (this.accessRecords.size > this.maxRecords) {
        const oldestKey = this.accessRecords.keys().next().value;
        if (typeof oldestKey === "string") {
          this.accessRecords.delete(oldestKey);
        }
      }
    }
    return pattern;
  }
  /**
   * 更新访问时间
   */
  updateAccessTime(pattern) {
    const now = Date.now();
    const interval = now - pattern.lastAccess;
    pattern.avgInterval = pattern.avgInterval === 0 ? interval : pattern.avgInterval * 0.9 + interval * 0.1;
    pattern.lastAccess = now;
  }
  /**
   * 记录性能数据
   */
  recordPerformance(operation, timestamp) {
    const duration = Date.now() - timestamp;
    let records = this.performanceRecords.get(operation);
    if (!records) {
      records = [];
      this.performanceRecords.set(operation, records);
    }
    records.push(duration);
    if (records.length > 1e3) {
      this.performanceRecords.set(operation, records.slice(-500));
    }
  }
  /**
   * 开始定期分析
   */
  startAnalysis(interval) {
    const setIntervalFn = typeof window !== "undefined" ? window.setInterval : globalThis.setInterval;
    this.analysisTimer = setIntervalFn(() => {
      void this.performAnalysis();
    }, interval);
  }
  /**
   * 执行分析
   */
  async performAnalysis() {
  }
  /**
   * 生成分析报告
   */
  async generateReport() {
    const now = Date.now();
    const stats = await this.cache.getStats();
    const patterns = Array.from(this.accessRecords.values());
    const hotKeys = this.identifyHotKeys(patterns);
    const coldKeys = this.identifyColdKeys(patterns);
    const frequentKeys = this.identifyFrequentKeys(patterns);
    const performance = this.calculatePerformanceMetrics();
    const storage = await this.analyzeStorage();
    const suggestions = this.generateSuggestions(patterns, performance, storage, stats);
    const totalOps = patterns.reduce((sum, p) => sum + p.accessCount, 0);
    const totalHits = patterns.reduce((sum, p) => sum + p.hitCount, 0);
    const hitRate = totalOps > 0 ? totalHits / totalOps : 0;
    const avgResponseTime = this.calculateAvgResponseTime();
    const errorRate = this.calculateErrorRate();
    return {
      timestamp: now,
      period: {
        start: this.startTime,
        end: now,
        duration: now - this.startTime
      },
      summary: {
        totalOperations: totalOps,
        hitRate,
        avgResponseTime,
        errorRate
      },
      accessPatterns: {
        hot: hotKeys,
        cold: coldKeys,
        frequent: frequentKeys
      },
      performance,
      storage,
      suggestions
    };
  }
  /**
   * 识别热键
   */
  identifyHotKeys(patterns) {
    const now = Date.now();
    const recentThreshold = 6e4;
    return patterns.filter((p) => now - p.lastAccess < recentThreshold).sort((a, b) => b.accessCount - a.accessCount).slice(0, 10);
  }
  /**
   * 识别冷键
   */
  identifyColdKeys(patterns) {
    const now = Date.now();
    const coldThreshold = 36e5;
    return patterns.filter((p) => now - p.lastAccess > coldThreshold).sort((a, b) => a.lastAccess - b.lastAccess).slice(0, 10);
  }
  /**
   * 识别频繁访问键
   */
  identifyFrequentKeys(patterns) {
    return patterns.filter((p) => p.avgInterval < 1e3).sort((a, b) => a.avgInterval - b.avgInterval).slice(0, 10);
  }
  /**
   * 计算性能指标
   */
  calculatePerformanceMetrics() {
    const metrics = [];
    for (const [operation, durations] of this.performanceRecords) {
      if (durations.length === 0) {
        continue;
      }
      const sorted = [...durations].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      metrics.push({
        operation,
        avgDuration: sum / sorted.length,
        minDuration: sorted[0] ?? 0,
        maxDuration: sorted[sorted.length - 1] ?? 0,
        count: sorted.length,
        p95Duration: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        p99Duration: sorted[Math.floor(sorted.length * 0.99)] ?? 0
      });
    }
    return metrics;
  }
  /**
   * 分析存储
   */
  async analyzeStorage() {
    const stats = await this.cache.getStats();
    const results = [];
    for (const [engine, engineStats] of Object.entries(stats.engines)) {
      const maxSize = "maxSize" in engineStats && typeof engineStats.maxSize === "number" ? engineStats.maxSize : Infinity;
      results.push({
        engine,
        usage: maxSize !== Infinity ? engineStats.size / maxSize : 0,
        itemCount: engineStats.itemCount,
        totalSize: engineStats.size,
        avgItemSize: engineStats.itemCount > 0 ? engineStats.size / engineStats.itemCount : 0,
        maxItemSize: 0,
        // 需要额外统计
        expiredCount: 0
        // 需要额外统计
      });
    }
    return results;
  }
  /**
   * 生成优化建议
   */
  generateSuggestions(patterns, performance, storage, stats) {
    const suggestions = [];
    const hitRate = typeof stats.hitRate === "number" ? stats.hitRate : 0;
    if (hitRate < 0.7) {
      suggestions.push({
        type: "performance",
        severity: "high",
        title: "\u4F4E\u7F13\u5B58\u547D\u4E2D\u7387",
        description: `\u5F53\u524D\u7F13\u5B58\u547D\u4E2D\u7387\u4E3A ${(hitRate * 100).toFixed(1)}%\uFF0C\u4F4E\u4E8E\u63A8\u8350\u503C 70%`,
        recommendation: "\u8003\u8651\u589E\u52A0\u7F13\u5B58\u5BB9\u91CF\u6216\u8C03\u6574\u7F13\u5B58\u7B56\u7565"
      });
    }
    const hotKeys = patterns.filter((p) => p.accessCount > 1e3);
    if (hotKeys.length > 0) {
      suggestions.push({
        type: "strategy",
        severity: "medium",
        title: "\u68C0\u6D4B\u5230\u70ED\u952E",
        description: `\u53D1\u73B0 ${hotKeys.length} \u4E2A\u9891\u7E41\u8BBF\u95EE\u7684\u952E`,
        recommendation: "\u8003\u8651\u5C06\u70ED\u952E\u6570\u636E\u5B58\u50A8\u5728\u5185\u5B58\u5F15\u64CE\u4E2D\u4EE5\u63D0\u9AD8\u6027\u80FD",
        affectedKeys: hotKeys.map((k) => k.key)
      });
    }
    const now = Date.now();
    const coldData = patterns.filter((p) => now - p.lastAccess > 864e5);
    if (coldData.length > patterns.length * 0.3) {
      suggestions.push({
        type: "storage",
        severity: "medium",
        title: "\u5B58\u5728\u5927\u91CF\u51B7\u6570\u636E",
        description: `${(coldData.length / patterns.length * 100).toFixed(1)}% \u7684\u6570\u636E\u8D85\u8FC7 1 \u5929\u672A\u8BBF\u95EE`,
        recommendation: "\u8003\u8651\u6E05\u7406\u51B7\u6570\u636E\u6216\u4F7F\u7528 TTL \u81EA\u52A8\u8FC7\u671F",
        affectedKeys: coldData.slice(0, 10).map((k) => k.key)
      });
    }
    const slowOps = performance.filter((p) => p.avgDuration > 100);
    if (slowOps.length > 0) {
      suggestions.push({
        type: "performance",
        severity: "high",
        title: "\u68C0\u6D4B\u5230\u6162\u64CD\u4F5C",
        description: `${slowOps.map((o) => o.operation).join(", ")} \u64CD\u4F5C\u5E73\u5747\u8017\u65F6\u8D85\u8FC7 100ms`,
        recommendation: "\u68C0\u67E5\u5B58\u50A8\u5F15\u64CE\u6027\u80FD\u6216\u8003\u8651\u4F7F\u7528\u6279\u91CF\u64CD\u4F5C"
      });
    }
    return suggestions;
  }
  /**
   * 计算平均响应时间
   */
  calculateAvgResponseTime() {
    const allDurations = [];
    for (const durations of this.performanceRecords.values()) {
      allDurations.push(...durations);
    }
    if (allDurations.length === 0) {
      return 0;
    }
    return allDurations.reduce((a, b) => a + b, 0) / allDurations.length;
  }
  /**
   * 计算错误率
   */
  calculateErrorRate() {
    const totalOps = Array.from(this.performanceRecords.values()).reduce((sum, records) => sum + records.length, 0);
    if (totalOps === 0) {
      return 0;
    }
    return this.errorRecords.length / (totalOps + this.errorRecords.length);
  }
  /**
   * 重置分析数据
   */
  reset() {
    this.accessRecords.clear();
    this.performanceRecords.clear();
    this.errorRecords = [];
    this.startTime = Date.now();
  }
  /**
   * 销毁分析器
   */
  destroy() {
    if (typeof this.analysisTimer === "number") {
      const clearIntervalFn = typeof window !== "undefined" ? window.clearInterval : globalThis.clearInterval;
      clearIntervalFn(this.analysisTimer);
      this.analysisTimer = void 0;
    }
    this.cache.off("get", this.handleGet.bind(this));
    this.cache.off("set", this.handleSet.bind(this));
    this.cache.off("remove", this.handleRemove.bind(this));
    this.cache.off("error", this.handleError.bind(this));
    this.reset();
  }
}
function createCacheAnalyzer(cache, config) {
  return new CacheAnalyzer(cache, config);
}

export { CacheAnalyzer, createCacheAnalyzer };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=cache-analyzer.js.map
