/*!
 * ***********************************
 * @ldesign/cache v0.1.1           *
 * Built with rollup               *
 * Build time: 2024-10-21 14:32:03 *
 * Build mode: production          *
 * Minified: No                    *
 * ***********************************
 */
class PerformanceProfiler {
  constructor(config = {}) {
    Object.defineProperty(this, "config", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "metrics", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Map()
    });
    Object.defineProperty(this, "activeMetrics", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /* @__PURE__ */ new Set()
    });
    Object.defineProperty(this, "reportTimer", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.config = {
      enabled: config.enabled ?? true,
      maxRecords: config.maxRecords ?? 1e3,
      autoReport: config.autoReport ?? false,
      reportInterval: config.reportInterval ?? 6e4,
      verbose: config.verbose ?? false
    };
    if (this.config?.autoReport) {
      this.startAutoReport();
    }
  }
  /**
   * 开始记录操作
   *
   * @param name - 操作名称
   * @param tags - 可选标签
   * @returns 性能度量对象
   */
  start(name, tags) {
    if (!this.config?.enabled) {
      return {
        name,
        startTime: 0,
        count: 0
      };
    }
    const metric = {
      name,
      startTime: performance.now(),
      count: 1,
      tags
    };
    this.activeMetrics.add(metric);
    return metric;
  }
  /**
   * 结束记录操作
   *
   * @param metric - 性能度量对象
   */
  end(metric) {
    if (!this.config?.enabled) {
      return;
    }
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    this.activeMetrics.delete(metric);
    this.recordMetric(metric);
  }
  /**
   * 记录度量
   *
   * @param metric - 性能度量
   */
  recordMetric(metric) {
    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, []);
    }
    const records = this.metrics.get(metric.name);
    records.push(metric);
    if (records.length > this.config?.maxRecords) {
      records.shift();
    }
  }
  /**
   * 测量异步操作
   *
   * @param name - 操作名称
   * @param fn - 要测量的函数
   * @param tags - 可选标签
   * @returns 函数返回值
   */
  async measure(name, fn, tags) {
    const metric = this.start(name, tags);
    try {
      return await fn();
    } finally {
      this.end(metric);
    }
  }
  /**
   * 测量同步操作
   *
   * @param name - 操作名称
   * @param fn - 要测量的函数
   * @param tags - 可选标签
   * @returns 函数返回值
   */
  measureSync(name, fn, tags) {
    const metric = this.start(name, tags);
    try {
      return fn();
    } finally {
      this.end(metric);
    }
  }
  /**
   * 获取操作统计
   *
   * @param name - 操作名称
   * @returns 统计信息，如果没有记录则返回 null
   */
  getStats(name) {
    const records = this.metrics.get(name);
    if (!records || records.length === 0) {
      return null;
    }
    const durations = records.filter((m) => m.duration !== void 0).map((m) => m.duration).sort((a, b) => a - b);
    if (durations.length === 0) {
      return null;
    }
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / durations.length;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p50 = durations[p50Index] ?? 0;
    const p95 = durations[p95Index] ?? 0;
    const p99 = durations[p99Index] ?? 0;
    const firstRecord = records[0];
    const lastRecord = records[records.length - 1];
    const timeSpan = (lastRecord.endTime ?? lastRecord.startTime) - firstRecord.startTime;
    const opsPerSecond = timeSpan > 0 ? records.length / timeSpan * 1e3 : 0;
    return {
      name,
      totalCalls: records.length,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      p50,
      p95,
      p99,
      opsPerSecond
    };
  }
  /**
   * 获取所有统计
   */
  getAllStats() {
    const stats = [];
    for (const name of this.metrics.keys()) {
      const stat = this.getStats(name);
      if (stat) {
        stats.push(stat);
      }
    }
    return stats.sort((a, b) => b.totalDuration - a.totalDuration);
  }
  /**
   * 生成性能报告
   *
   * @param topN - 显示前 N 个最慢的操作
   * @returns 报告字符串
   */
  generateReport(topN) {
    const allStats = this.getAllStats();
    const stats = topN ? allStats.slice(0, topN) : allStats;
    if (stats.length === 0) {
      return "\u6CA1\u6709\u6027\u80FD\u6570\u636E";
    }
    const lines = ["=".repeat(120), "\u6027\u80FD\u5206\u6790\u62A5\u544A", "=".repeat(120), ""];
    const totalCalls = stats.reduce((sum, s) => sum + s.totalCalls, 0);
    const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
    const avgOps = stats.reduce((sum, s) => sum + s.opsPerSecond, 0) / stats.length;
    lines.push("\u6458\u8981:");
    lines.push(`  \u603B\u64CD\u4F5C\u6570: ${totalCalls.toLocaleString()}`);
    lines.push(`  \u603B\u8017\u65F6: ${totalDuration.toFixed(2)} ms`);
    lines.push(`  \u5E73\u5747\u541E\u5410\u91CF: ${avgOps.toFixed(0)} ops/sec`);
    lines.push(`  \u6D3B\u52A8\u6307\u6807: ${this.activeMetrics.size}`);
    lines.push("");
    lines.push("\u8BE6\u7EC6\u7EDF\u8BA1:");
    lines.push("");
    for (const stat of stats) {
      lines.push(`\u64CD\u4F5C: ${stat.name}`);
      lines.push(`  \u8C03\u7528\u6B21\u6570: ${stat.totalCalls.toLocaleString()}`);
      lines.push(`  \u603B\u8017\u65F6: ${stat.totalDuration.toFixed(2)} ms`);
      lines.push(`  \u5E73\u5747\u8017\u65F6: ${stat.avgDuration.toFixed(3)} ms`);
      lines.push(`  \u5EF6\u8FDF\u8303\u56F4: ${stat.minDuration.toFixed(3)} - ${stat.maxDuration.toFixed(3)} ms`);
      lines.push(`  P50: ${stat.p50.toFixed(3)} ms`);
      lines.push(`  P95: ${stat.p95.toFixed(3)} ms`);
      lines.push(`  P99: ${stat.p99.toFixed(3)} ms`);
      lines.push(`  \u541E\u5410\u91CF: ${stat.opsPerSecond.toFixed(0)} ops/sec`);
      lines.push("");
    }
    const bottlenecks = this.identifyBottlenecks(stats);
    if (bottlenecks.length > 0) {
      lines.push("\u8BC6\u522B\u7684\u6027\u80FD\u74F6\u9888:");
      for (const bottleneck of bottlenecks) {
        lines.push(`  \u26A0\uFE0F  ${bottleneck}`);
      }
      lines.push("");
    }
    lines.push("=".repeat(120));
    return lines.join("\n");
  }
  /**
   * 识别性能瓶颈
   *
   * @param stats - 统计信息数组
   * @returns 瓶颈描述数组
   */
  identifyBottlenecks(stats) {
    const bottlenecks = [];
    for (const stat of stats) {
      if (stat.p99 > 100) {
        bottlenecks.push(`${stat.name}: P99 \u5EF6\u8FDF\u8FC7\u9AD8 (${stat.p99.toFixed(2)} ms)`);
      }
      if (stat.opsPerSecond < 100 && stat.totalCalls > 10) {
        bottlenecks.push(`${stat.name}: \u541E\u5410\u91CF\u8FC7\u4F4E (${stat.opsPerSecond.toFixed(0)} ops/sec)`);
      }
      const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
      const percentage = stat.totalDuration / totalDuration * 100;
      if (percentage > 30) {
        bottlenecks.push(`${stat.name}: \u8017\u65F6\u5360\u6BD4\u8FC7\u9AD8 (${percentage.toFixed(1)}%)`);
      }
      const variance = stat.maxDuration - stat.minDuration;
      if (variance > stat.avgDuration * 10) {
        bottlenecks.push(`${stat.name}: \u6027\u80FD\u4E0D\u7A33\u5B9A (\u5EF6\u8FDF\u6CE2\u52A8 ${variance.toFixed(2)} ms)`);
      }
    }
    return bottlenecks;
  }
  /**
   * 清除所有记录
   */
  clear() {
    this.metrics.clear();
    this.activeMetrics.clear();
  }
  /**
   * 导出数据为 JSON
   */
  exportData() {
    const data = {};
    for (const [name, metrics] of this.metrics) {
      data[name] = metrics;
    }
    return JSON.stringify(data, null, 2);
  }
  /**
   * 启动自动报告
   */
  startAutoReport() {
    if (this.reportTimer) {
      return;
    }
    this.reportTimer = setInterval(() => {
      if (this.config?.verbose) {
        console.info(this.generateReport());
      }
    }, this.config?.reportInterval);
  }
  /**
   * 停止自动报告
   */
  stopAutoReport() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = void 0;
    }
  }
  /**
   * 更新配置
   */
  updateConfig(config) {
    Object.assign(this.config, config);
    if (this.config?.autoReport && !this.reportTimer) {
      this.startAutoReport();
    } else if (!this.config?.autoReport && this.reportTimer) {
      this.stopAutoReport();
    }
  }
  /**
   * 销毁分析器
   */
  destroy() {
    this.stopAutoReport();
    this.clear();
  }
}
function createProfiler(config) {
  return new PerformanceProfiler(config);
}
const globalProfiler = createProfiler({
  enabled: false
});
function enableProfiling() {
  globalProfiler.updateConfig({
    enabled: true
  });
}
function disableProfiling() {
  globalProfiler.updateConfig({
    enabled: false
  });
}
function generateGlobalReport() {
  return globalProfiler.generateReport();
}

export { PerformanceProfiler, createProfiler, disableProfiling, enableProfiling, generateGlobalReport, globalProfiler };
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=performance-profiler.js.map
