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

class PerformanceBenchmark {
  constructor(cache) {
    Object.defineProperty(this, "cache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: cache
    });
    Object.defineProperty(this, "results", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
  }
  /**
   * 运行基准测试
   */
  async run(testFn, config) {
    const {
      name,
      operations = 1e3,
      warmup = 100,
      measureMemory = false
    } = config;
    for (let i = 0; i < warmup; i++) {
      await testFn(this.cache, i);
    }
    await this.cache.clear();
    const memoryBefore = measureMemory ? this.getMemoryUsage() : 0;
    const latencies = [];
    const startTime = performance.now();
    for (let i = 0; i < operations; i++) {
      const opStart = performance.now();
      await testFn(this.cache, i);
      const opEnd = performance.now();
      latencies.push(opEnd - opStart);
    }
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryAfter = measureMemory ? this.getMemoryUsage() : 0;
    const memoryUsed = memoryAfter - memoryBefore;
    latencies.sort((a, b) => a - b);
    const result = {
      name,
      operations,
      duration,
      opsPerSecond: operations / duration * 1e3,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: latencies[0] ?? 0,
      maxLatency: latencies[latencies.length - 1] ?? 0,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] ?? 0,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] ?? 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] ?? 0,
      memoryUsed: measureMemory ? memoryUsed : void 0
    };
    this.results.push(result);
    return result;
  }
  /**
   * 运行一组基准测试
   */
  async runSuite(tests) {
    const results = [];
    for (const test of tests) {
      const result = await this.run(test.fn, {
        name: test.name,
        ...test.config
      });
      results.push(result);
      await this.cache.clear();
      await this.delay(100);
    }
    return results;
  }
  /**
   * 生成性能报告
   */
  generateReport() {
    if (this.results.length === 0) {
      return "No benchmark results available";
    }
    const lines = ["=".repeat(100), "\u6027\u80FD\u57FA\u51C6\u6D4B\u8BD5\u62A5\u544A", "=".repeat(100), ""];
    for (const result of this.results) {
      lines.push(`\u6D4B\u8BD5: ${result.name}`);
      lines.push(`  \u64CD\u4F5C\u6570: ${result.operations.toLocaleString()}`);
      lines.push(`  \u603B\u8017\u65F6: ${result.duration.toFixed(2)} ms`);
      lines.push(`  \u541E\u5410\u91CF: ${result.opsPerSecond.toFixed(0)} ops/sec`);
      lines.push(`  \u5E73\u5747\u5EF6\u8FDF: ${result.avgLatency.toFixed(3)} ms`);
      lines.push(`  \u5EF6\u8FDF\u8303\u56F4: ${result.minLatency.toFixed(3)} - ${result.maxLatency.toFixed(3)} ms`);
      lines.push(`  P50 \u5EF6\u8FDF: ${result.p50Latency.toFixed(3)} ms`);
      lines.push(`  P95 \u5EF6\u8FDF: ${result.p95Latency.toFixed(3)} ms`);
      lines.push(`  P99 \u5EF6\u8FDF: ${result.p99Latency.toFixed(3)} ms`);
      if (result.memoryUsed !== void 0) {
        lines.push(`  \u5185\u5B58\u4F7F\u7528: ${this.formatBytes(result.memoryUsed)}`);
      }
      lines.push("");
    }
    lines.push("=".repeat(100));
    return lines.join("\n");
  }
  /**
   * 比较两个基准测试结果
   */
  compare(baseline, current) {
    const lines = [`\u5BF9\u6BD4: ${baseline.name} vs ${current.name}`, ""];
    const throughputChange = (current.opsPerSecond - baseline.opsPerSecond) / baseline.opsPerSecond * 100;
    const latencyChange = (current.avgLatency - baseline.avgLatency) / baseline.avgLatency * 100;
    lines.push(`  \u541E\u5410\u91CF\u53D8\u5316: ${throughputChange > 0 ? "+" : ""}${throughputChange.toFixed(2)}%`);
    lines.push(`  \u5EF6\u8FDF\u53D8\u5316: ${latencyChange > 0 ? "+" : ""}${latencyChange.toFixed(2)}%`);
    if (typeof baseline.memoryUsed === "number" && typeof current.memoryUsed === "number") {
      const memoryChange = (current.memoryUsed - baseline.memoryUsed) / baseline.memoryUsed * 100;
      lines.push(`  \u5185\u5B58\u53D8\u5316: ${memoryChange > 0 ? "+" : ""}${memoryChange.toFixed(2)}%`);
    }
    return lines.join("\n");
  }
  /**
   * 获取所有结果
   */
  getResults() {
    return [...this.results];
  }
  /**
   * 清除结果
   */
  clearResults() {
    this.results = [];
  }
  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    if (typeof performance !== "undefined" && "memory" in performance) {
      const perfWithMemory = performance;
      return perfWithMemory.memory?.usedJSHeapSize ?? 0;
    }
    if (typeof globalThis !== "undefined" && globalThis.process && typeof globalThis.process.memoryUsage === "function") {
      return globalThis.process.memoryUsage().heapUsed;
    }
    return 0;
  }
  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) {
      return "0 B";
    }
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
  }
  /**
   * 延迟
   */
  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
function createBenchmark(cache) {
  return new PerformanceBenchmark(cache);
}
const standardBenchmarks = {
  /**
   * 基础操作测试
   */
  basicOperations: [{
    name: "Set (\u5C0F\u5B57\u7B26\u4E32)",
    fn: async (cache, index) => {
      await cache.set(`key-${index}`, `value-${index}`);
    }
  }, {
    name: "Get (\u5B58\u5728\u7684\u952E)",
    fn: async (cache, index) => {
      if (index === 0) {
        for (let i = 0; i < 1e3; i++) {
          await cache.set(`key-${i}`, `value-${i}`);
        }
      }
      await cache.get(`key-${index % 1e3}`);
    }
  }, {
    name: "Get (\u4E0D\u5B58\u5728\u7684\u952E)",
    fn: async (cache, index) => {
      await cache.get(`nonexistent-${index}`);
    }
  }, {
    name: "Remove",
    fn: async (cache, index) => {
      await cache.set(`key-${index}`, `value-${index}`);
      await cache.remove(`key-${index}`);
    }
  }],
  /**
   * 不同数据大小测试
   */
  dataSizes: [{
    name: "Set (1KB \u6570\u636E)",
    fn: async (cache, index) => {
      const data = "x".repeat(1024);
      await cache.set(`key-${index}`, data);
    }
  }, {
    name: "Set (10KB \u6570\u636E)",
    fn: async (cache, index) => {
      const data = "x".repeat(10 * 1024);
      await cache.set(`key-${index}`, data);
    }
  }, {
    name: "Set (100KB \u6570\u636E)",
    fn: async (cache, index) => {
      const data = "x".repeat(100 * 1024);
      await cache.set(`key-${index}`, data);
    },
    config: {
      operations: 100
    }
    // 减少操作次数
  }],
  /**
   * 批量操作测试
   */
  batchOperations: [{
    name: "Batch Set (10\u9879)",
    fn: async (cache, index) => {
      const items = Array.from({
        length: 10
      }, (_, i) => ({
        key: `batch-${index}-${i}`,
        value: `value-${i}`
      }));
      await cache.mset(items);
    },
    config: {
      operations: 100
    }
  }, {
    name: "Batch Get (10\u9879)",
    fn: async (cache, index) => {
      if (index === 0) {
        for (let i = 0; i < 100; i++) {
          for (let j = 0; j < 10; j++) {
            await cache.set(`batch-${i}-${j}`, `value-${j}`);
          }
        }
      }
      const keys = Array.from({
        length: 10
      }, (_, i) => `batch-${index}-${i}`);
      await cache.mget(keys);
    },
    config: {
      operations: 100
    }
  }],
  /**
   * TTL 测试
   */
  ttlOperations: [{
    name: "Set (\u5E26 TTL)",
    fn: async (cache, index) => {
      await cache.set(`key-${index}`, `value-${index}`, {
        ttl: 6e4
      });
    }
  }, {
    name: "Get (\u8FC7\u671F\u68C0\u67E5)",
    fn: async (cache, index) => {
      if (index === 0) {
        for (let i = 0; i < 1e3; i++) {
          await cache.set(`key-${i}`, `value-${i}`, {
            ttl: 6e4
          });
        }
      }
      await cache.get(`key-${index % 1e3}`);
    }
  }]
};
async function runStandardBenchmarks(cache) {
  const benchmark = createBenchmark(cache);
  console.info("\u5F00\u59CB\u8FD0\u884C\u6807\u51C6\u57FA\u51C6\u6D4B\u8BD5...");
  await benchmark.runSuite(standardBenchmarks.basicOperations);
  await benchmark.runSuite(standardBenchmarks.dataSizes);
  await benchmark.runSuite(standardBenchmarks.batchOperations);
  await benchmark.runSuite(standardBenchmarks.ttlOperations);
  console.info("\n\u6D4B\u8BD5\u5B8C\u6210\uFF01\u751F\u6210\u62A5\u544A...");
  console.info(benchmark.generateReport());
}

exports.PerformanceBenchmark = PerformanceBenchmark;
exports.createBenchmark = createBenchmark;
exports.runStandardBenchmarks = runStandardBenchmarks;
exports.standardBenchmarks = standardBenchmarks;
/*! End of @ldesign/cache | Powered by @ldesign/builder */
//# sourceMappingURL=performance-benchmark.cjs.map
