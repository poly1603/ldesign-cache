/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class Prefetcher {
  constructor(cache, options = {}) {
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "rules", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "accessHistory", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "patterns", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "tasks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "runningTasks", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 0
    });
    Object.defineProperty(this, "idleTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "lastAccessTime", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: Date.now()
    });
    this.cache = cache;
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      timeout: options.timeout ?? 5e3,
      enablePredictive: options.enablePredictive ?? true,
      predictionWindow: options.predictionWindow ?? 5,
      minConfidence: options.minConfidence ?? 0.6,
      prefetchOnIdle: options.prefetchOnIdle ?? true,
      idleThreshold: options.idleThreshold ?? 2e3
    };
    if (this.options.prefetchOnIdle) {
      this.setupIdleDetection();
    }
  }
  /**
   * 添加预取规则
   */
  addRule(rule) {
    this.rules.set(rule.id, {
      ...rule,
      priority: rule.priority ?? 0,
      strategy: rule.strategy ?? "lazy"
    });
  }
  /**
   * 移除预取规则
   */
  removeRule(id) {
    this.rules.delete(id);
  }
  /**
   * 记录访问
   */
  recordAccess(key) {
    this.lastAccessTime = Date.now();
    this.accessHistory.push(key);
    if (this.accessHistory.length > 100) {
      this.accessHistory.shift();
    }
    if (this.options.enablePredictive) {
      this.updatePatterns(key);
    }
    this.checkPrefetchRules({
      currentKey: key,
      recentKeys: this.getRecentKeys(),
      timestamp: Date.now()
    });
    if (this.options.enablePredictive) {
      this.predictivePrefetch(key);
    }
  }
  /**
   * 获取最近访问的键
   */
  getRecentKeys(count = 10) {
    return this.accessHistory.slice(-count);
  }
  /**
   * 更新访问模式
   */
  updatePatterns(currentKey) {
    const window2 = this.options.predictionWindow;
    const recent = this.accessHistory.slice(-window2 - 1, -1);
    if (recent.length < window2) {
      return;
    }
    const pattern = recent.join("->");
    const existing = this.patterns.get(pattern) || {
      sequence: [...recent, currentKey],
      count: 0,
      lastAccess: 0
    };
    existing.count++;
    existing.lastAccess = Date.now();
    this.patterns.set(pattern, existing);
    this.cleanupPatterns();
  }
  /**
   * 清理旧的访问模式
   */
  cleanupPatterns() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1e3;
    for (const [key, pattern] of this.patterns.entries()) {
      if (now - pattern.lastAccess > maxAge) {
        this.patterns.delete(key);
      }
    }
  }
  /**
   * 预测性预取
   */
  async predictivePrefetch(currentKey) {
    const predictions = this.predictNextKeys(currentKey);
    for (const {
      key,
      confidence
    } of predictions) {
      if (confidence >= this.options.minConfidence && !this.cache.has(key)) {
        this.createTask({
          id: `predictive-${key}-${Date.now()}`,
          keys: [key],
          fetcher: async () => null,
          // 需要外部提供
          priority: Math.floor(confidence * 10),
          strategy: "predictive"
        });
      }
    }
  }
  /**
   * 预测下一个可能访问的键
   */
  predictNextKeys(_currentKey) {
    const predictions = /* @__PURE__ */ new Map();
    const window2 = this.options.predictionWindow;
    const recent = this.accessHistory.slice(-window2);
    if (recent.length < window2) {
      return [];
    }
    const currentPattern = recent.join("->");
    let totalMatches = 0;
    for (const [pattern, data] of this.patterns.entries()) {
      if (pattern === currentPattern) {
        const nextKey = data.sequence[data.sequence.length - 1];
        predictions.set(nextKey, (predictions.get(nextKey) || 0) + data.count);
        totalMatches += data.count;
      }
    }
    const results = [];
    for (const [key, count] of predictions.entries()) {
      results.push({
        key,
        confidence: count / totalMatches
      });
    }
    return results.sort((a, b) => b.confidence - a.confidence);
  }
  /**
   * 检查预取规则
   */
  async checkPrefetchRules(context) {
    const triggeredRules = [];
    for (const rule of this.rules.values()) {
      if (rule.trigger(context)) {
        triggeredRules.push(rule);
      }
    }
    triggeredRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const rule of triggeredRules) {
      const keys = typeof rule.keys === "function" ? rule.keys(context) : rule.keys;
      this.createTask({
        id: `rule-${rule.id}-${Date.now()}`,
        keys,
        fetcher: rule.fetcher,
        priority: rule.priority || 0,
        strategy: rule.strategy || "lazy"
      });
      if (rule.strategy === "eager") {
        await this.executeTasks();
      } else if (rule.delay) {
        setTimeout(async () => this.executeTasks(), rule.delay);
      }
    }
  }
  /**
   * 创建预取任务
   */
  createTask(params) {
    const task = {
      ...params,
      status: "pending",
      progress: 0,
      results: /* @__PURE__ */ new Map(),
      errors: /* @__PURE__ */ new Map()
    };
    this.tasks.set(task.id, task);
  }
  /**
   * 执行预取任务
   */
  async executeTasks() {
    const pendingTasks = Array.from(this.tasks.values()).filter((t) => t.status === "pending").sort((a, b) => b.priority - a.priority);
    for (const task of pendingTasks) {
      if (this.runningTasks >= this.options.maxConcurrent) {
        break;
      }
      this.runTask(task);
    }
  }
  /**
   * 运行单个任务
   */
  async runTask(task) {
    task.status = "running";
    this.runningTasks++;
    try {
      const total = task.keys.length;
      let completed = 0;
      const promises = task.keys.map(async (key) => {
        if (this.cache.has(key)) {
          completed++;
          task.progress = completed / total;
          return;
        }
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), this.options.timeout);
          });
          const value = await Promise.race([task.fetcher(key), timeoutPromise]);
          this.cache.set(key, value);
          task.results?.set(key, value);
        } catch (error) {
          task.errors?.set(key, error);
        } finally {
          completed++;
          task.progress = completed / total;
        }
      });
      await Promise.all(promises);
      task.status = "completed";
    } catch {
      task.status = "failed";
    } finally {
      this.runningTasks--;
      if (task.status === "completed") {
        setTimeout(() => this.tasks.delete(task.id), 6e4);
      }
    }
  }
  /**
   * 设置空闲检测
   */
  setupIdleDetection() {
    const checkIdle = () => {
      const now = Date.now();
      if (now - this.lastAccessTime > this.options.idleThreshold) {
        this.onIdle();
      }
      this.idleTimer = window.setTimeout(checkIdle, 1e3);
    };
    checkIdle();
  }
  /**
   * 空闲时触发
   */
  onIdle() {
    this.executeTasks();
    this.warmupFrequentKeys();
  }
  /**
   * 预热常用键
   */
  warmupFrequentKeys() {
    const frequency = /* @__PURE__ */ new Map();
    for (const key of this.accessHistory) {
      frequency.set(key, (frequency.get(key) || 0) + 1);
    }
    const frequentKeys = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([key]) => key);
    if (frequentKeys.length > 0) {
      this.createTask({
        id: `warmup-${Date.now()}`,
        keys: frequentKeys,
        fetcher: async () => null,
        // 需要外部提供
        priority: -1,
        // 低优先级
        strategy: "lazy"
      });
    }
  }
  /**
   * 手动预取
   */
  async prefetch(keys, fetcher, options) {
    const task = {
      id: `manual-${Date.now()}`,
      keys,
      fetcher,
      priority: options?.priority ?? 5,
      strategy: options?.strategy ?? "manual",
      status: "pending",
      progress: 0,
      results: /* @__PURE__ */ new Map(),
      errors: /* @__PURE__ */ new Map()
    };
    this.tasks.set(task.id, task);
    if (task.strategy === "eager") {
      await this.runTask(task);
    } else {
      this.executeTasks();
    }
  }
  /**
   * 获取预取统计
   */
  getStats() {
    const tasks = Array.from(this.tasks.values());
    const currentKey = this.accessHistory[this.accessHistory.length - 1];
    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === "pending").length,
      runningTasks: tasks.filter((t) => t.status === "running").length,
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      failedTasks: tasks.filter((t) => t.status === "failed").length,
      patterns: this.patterns.size,
      predictions: currentKey ? this.predictNextKeys(currentKey) : []
    };
  }
  /**
   * 清理
   */
  dispose() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.tasks.clear();
    this.patterns.clear();
    this.accessHistory.length = 0;
  }
}
function withPrefetching(cache, options) {
  const cacheMap = /* @__PURE__ */ new Map();
  const prefetcher = new Prefetcher(cacheMap, options);
  return {
    ...cache,
    prefetcher,
    async get(key) {
      prefetcher.recordAccess(key);
      if (cacheMap.has(key)) {
        return cacheMap.get(key);
      }
      const value = await cache.get(key);
      if (value !== null && value !== void 0) {
        cacheMap.set(key, value);
      }
      return value;
    },
    async set(key, value, setOptions) {
      cacheMap.set(key, value);
      return cache.set(key, value, setOptions);
    },
    async has(key) {
      return cacheMap.has(key) || await cache.has(key);
    }
  };
}

export { Prefetcher, withPrefetching };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=prefetcher.js.map
