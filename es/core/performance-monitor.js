/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
import '../utils/error-handler.js';
import { EventEmitter } from '../utils/event-emitter.js';
import '../utils/object-pool.js';
import '../utils/performance-profiler.js';
import '../utils/serialization-cache.js';
import '../utils/validator.js';

class PerformanceMonitor {
  constructor(options = {}) {
    Object.defineProperty(this, "metrics", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "emitter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: new EventEmitter()
    });
    Object.defineProperty(this, "options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.options = {
      enabled: options.enabled ?? true,
      slowThreshold: options.slowThreshold ?? 100,
      maxRecords: options.maxRecords ?? 1e3,
      samplingRate: options.samplingRate ?? 1,
      detailed: options.detailed ?? false,
      collector: options.collector ?? (() => {
      })
    };
  }
  /**
   * 开始测量
   */
  startMeasure() {
    const startTime = performance.now();
    return {
      end: (success, error) => {
        const duration = performance.now() - startTime;
        if (this.shouldRecord()) {
          const metrics = {
            operation: "unknown",
            duration,
            success,
            error: error?.message,
            timestamp: Date.now()
          };
          this.record(metrics);
        }
      }
    };
  }
  /**
   * 测量异步操作
   */
  async measure(operation, fn, context) {
    if (!this.options.enabled || !this.shouldRecord()) {
      return fn();
    }
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.record({
        operation,
        duration,
        success: true,
        timestamp: Date.now(),
        ...context
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.record({
        operation,
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        ...context
      });
      throw error;
    }
  }
  /**
   * 记录性能指标
   */
  record(metrics) {
    if (!this.options.enabled) {
      return;
    }
    if (this.metrics.length >= this.options.maxRecords) {
      this.metrics.shift();
    }
    this.metrics.push(metrics);
    if (metrics.duration > this.options.slowThreshold) {
      this.emitter.emit("slow", metrics);
    }
    this.options.collector(metrics);
    this.emitter.emit("metrics", metrics);
  }
  /**
   * 判断是否应该记录
   */
  shouldRecord() {
    return Math.random() < this.options.samplingRate;
  }
  /**
   * 获取统计信息
   */
  getStats(filter) {
    let filtered = this.metrics;
    if (filter) {
      filtered = this.metrics.filter((m) => {
        if (filter.operation && m.operation !== filter.operation) {
          return false;
        }
        if (filter.engine && m.engine !== filter.engine) {
          return false;
        }
        if (filter.since && m.timestamp < filter.since) {
          return false;
        }
        return true;
      });
    }
    if (filtered.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        failureCount: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalDataSize: 0,
        operationDistribution: {},
        engineDistribution: {},
        slowOperations: []
      };
    }
    const successCount = filtered.filter((m) => m.success).length;
    const failureCount = filtered.filter((m) => !m.success).length;
    const durations = filtered.map((m) => m.duration);
    const totalDataSize = filtered.reduce((sum, m) => sum + (m.dataSize || 0), 0);
    const operationDistribution = {};
    filtered.forEach((m) => {
      operationDistribution[m.operation] = (operationDistribution[m.operation] || 0) + 1;
    });
    const engineDistribution = {};
    filtered.forEach((m) => {
      if (m.engine) {
        engineDistribution[m.engine] = (engineDistribution[m.engine] || 0) + 1;
      }
    });
    const slowOperations = filtered.filter((m) => m.duration > this.options.slowThreshold);
    return {
      totalOperations: filtered.length,
      successCount,
      failureCount,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDataSize,
      operationDistribution,
      engineDistribution,
      slowOperations
    };
  }
  /**
   * 获取百分位数
   */
  getPercentiles(percentiles = [50, 75, 90, 95, 99]) {
    const durations = this.metrics.map((m) => m.duration).sort((a, b) => a - b);
    if (durations.length === 0) {
      return Object.fromEntries(percentiles.map((p) => [`p${p}`, 0]));
    }
    const result = {};
    percentiles.forEach((p) => {
      const index = Math.ceil(p / 100 * durations.length) - 1;
      result[`p${p}`] = durations[Math.max(0, index)];
    });
    return result;
  }
  /**
   * 清空记录
   */
  clear() {
    this.metrics = [];
  }
  /**
   * 导出指标
   */
  export() {
    return [...this.metrics];
  }
  /**
   * 导入指标
   */
  import(metrics) {
    this.metrics.push(...metrics);
    while (this.metrics.length > this.options.maxRecords) {
      this.metrics.shift();
    }
  }
  /**
   * 监听事件
   */
  on(event, listener) {
    this.emitter.on(event, listener);
  }
  /**
   * 移除监听器
   */
  off(event, listener) {
    this.emitter.off(event, listener);
  }
  /**
   * 生成报告
   */
  generateReport() {
    const stats = this.getStats();
    const percentiles = this.getPercentiles();
    return `
=== \u7F13\u5B58\u6027\u80FD\u62A5\u544A ===
\u65F6\u95F4: ${(/* @__PURE__ */ new Date()).toISOString()}

\u6982\u89C8:
- \u603B\u64CD\u4F5C\u6570: ${stats.totalOperations}
- \u6210\u529F\u7387: ${stats.totalOperations > 0 ? (stats.successCount / stats.totalOperations * 100).toFixed(2) : 0}%
- \u5E73\u5747\u8017\u65F6: ${stats.averageDuration.toFixed(2)}ms
- \u6700\u5C0F/\u6700\u5927\u8017\u65F6: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms
- \u603B\u6570\u636E\u91CF: ${(stats.totalDataSize / 1024).toFixed(2)}KB

\u767E\u5206\u4F4D\u6570:
${Object.entries(percentiles).map(([k, v]) => `- ${k}: ${v.toFixed(2)}ms`).join("\n")}

\u64CD\u4F5C\u5206\u5E03:
${Object.entries(stats.operationDistribution).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

\u5F15\u64CE\u5206\u5E03:
${Object.entries(stats.engineDistribution).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

\u6162\u64CD\u4F5C (>${this.options.slowThreshold}ms): ${stats.slowOperations.length}
${stats.slowOperations.slice(0, 5).map((m) => `  - ${m.operation} [${m.key}]: ${m.duration.toFixed(2)}ms`).join("\n")}
    `.trim();
  }
}

export { PerformanceMonitor };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=performance-monitor.js.map
