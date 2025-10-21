/**
 * 性能基准测试套件
 *
 * 提供全面的性能测试工具，用于验证优化效果
 */
/**
 * 性能基准测试器
 */
export class PerformanceBenchmark {
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
        const { name, operations = 1000, warmup = 100, measureMemory = false, } = config;
        // 预热阶段
        for (let i = 0; i < warmup; i++) {
            await testFn(this.cache, i);
        }
        // 清理缓存
        await this.cache.clear();
        // 测量内存（前）
        const memoryBefore = measureMemory ? this.getMemoryUsage() : 0;
        // 执行测试
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
        // 测量内存（后）
        const memoryAfter = measureMemory ? this.getMemoryUsage() : 0;
        const memoryUsed = memoryAfter - memoryBefore;
        // 计算统计数据
        latencies.sort((a, b) => a - b);
        const result = {
            name,
            operations,
            duration,
            opsPerSecond: (operations / duration) * 1000,
            avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            minLatency: latencies[0] ?? 0,
            maxLatency: latencies[latencies.length - 1] ?? 0,
            p50Latency: latencies[Math.floor(latencies.length * 0.5)] ?? 0,
            p95Latency: latencies[Math.floor(latencies.length * 0.95)] ?? 0,
            p99Latency: latencies[Math.floor(latencies.length * 0.99)] ?? 0,
            memoryUsed: measureMemory ? memoryUsed : undefined,
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
                ...test.config,
            });
            results.push(result);
            // 清理缓存
            await this.cache.clear();
            // 短暂延迟，让 GC 有机会运行
            await this.delay(100);
        }
        return results;
    }
    /**
     * 生成性能报告
     */
    generateReport() {
        if (this.results.length === 0) {
            return 'No benchmark results available';
        }
        const lines = [
            '='.repeat(100),
            '性能基准测试报告',
            '='.repeat(100),
            '',
        ];
        for (const result of this.results) {
            lines.push(`测试: ${result.name}`);
            lines.push(`  操作数: ${result.operations.toLocaleString()}`);
            lines.push(`  总耗时: ${result.duration.toFixed(2)} ms`);
            lines.push(`  吞吐量: ${result.opsPerSecond.toFixed(0)} ops/sec`);
            lines.push(`  平均延迟: ${result.avgLatency.toFixed(3)} ms`);
            lines.push(`  延迟范围: ${result.minLatency.toFixed(3)} - ${result.maxLatency.toFixed(3)} ms`);
            lines.push(`  P50 延迟: ${result.p50Latency.toFixed(3)} ms`);
            lines.push(`  P95 延迟: ${result.p95Latency.toFixed(3)} ms`);
            lines.push(`  P99 延迟: ${result.p99Latency.toFixed(3)} ms`);
            if (result.memoryUsed !== undefined) {
                lines.push(`  内存使用: ${this.formatBytes(result.memoryUsed)}`);
            }
            lines.push('');
        }
        lines.push('='.repeat(100));
        return lines.join('\n');
    }
    /**
     * 比较两个基准测试结果
     */
    compare(baseline, current) {
        const lines = [
            `对比: ${baseline.name} vs ${current.name}`,
            '',
        ];
        const throughputChange = ((current.opsPerSecond - baseline.opsPerSecond) / baseline.opsPerSecond) * 100;
        const latencyChange = ((current.avgLatency - baseline.avgLatency) / baseline.avgLatency) * 100;
        lines.push(`  吞吐量变化: ${throughputChange > 0 ? '+' : ''}${throughputChange.toFixed(2)}%`);
        lines.push(`  延迟变化: ${latencyChange > 0 ? '+' : ''}${latencyChange.toFixed(2)}%`);
        if (typeof baseline.memoryUsed === 'number' && typeof current.memoryUsed === 'number') {
            const memoryChange = ((current.memoryUsed - baseline.memoryUsed) / baseline.memoryUsed) * 100;
            lines.push(`  内存变化: ${memoryChange > 0 ? '+' : ''}${memoryChange.toFixed(2)}%`);
        }
        return lines.join('\n');
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
        // 检查浏览器环境的内存 API
        if (typeof performance !== 'undefined' && 'memory' in performance) {
            const perfWithMemory = performance;
            return perfWithMemory.memory?.usedJSHeapSize ?? 0;
        }
        // 检查 Node.js 环境
        // eslint-disable-next-line node/prefer-global/process
        if (typeof globalThis !== 'undefined' && globalThis.process && typeof globalThis.process.memoryUsage === 'function') {
            // eslint-disable-next-line node/prefer-global/process
            return globalThis.process.memoryUsage().heapUsed;
        }
        return 0;
    }
    /**
     * 格式化字节大小
     */
    formatBytes(bytes) {
        if (bytes === 0) {
            return '0 B';
        }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
    }
    /**
     * 延迟
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * 创建性能基准测试器
 */
export function createBenchmark(cache) {
    return new PerformanceBenchmark(cache);
}
/**
 * 预定义的基准测试套件
 */
export const standardBenchmarks = {
    /**
     * 基础操作测试
     */
    basicOperations: [
        {
            name: 'Set (小字符串)',
            fn: async (cache, index) => {
                await cache.set(`key-${index}`, `value-${index}`);
            },
        },
        {
            name: 'Get (存在的键)',
            fn: async (cache, index) => {
                // 预先设置
                if (index === 0) {
                    for (let i = 0; i < 1000; i++) {
                        await cache.set(`key-${i}`, `value-${i}`);
                    }
                }
                await cache.get(`key-${index % 1000}`);
            },
        },
        {
            name: 'Get (不存在的键)',
            fn: async (cache, index) => {
                await cache.get(`nonexistent-${index}`);
            },
        },
        {
            name: 'Remove',
            fn: async (cache, index) => {
                // 预先设置
                await cache.set(`key-${index}`, `value-${index}`);
                await cache.remove(`key-${index}`);
            },
        },
    ],
    /**
     * 不同数据大小测试
     */
    dataSizes: [
        {
            name: 'Set (1KB 数据)',
            fn: async (cache, index) => {
                const data = 'x'.repeat(1024);
                await cache.set(`key-${index}`, data);
            },
        },
        {
            name: 'Set (10KB 数据)',
            fn: async (cache, index) => {
                const data = 'x'.repeat(10 * 1024);
                await cache.set(`key-${index}`, data);
            },
        },
        {
            name: 'Set (100KB 数据)',
            fn: async (cache, index) => {
                const data = 'x'.repeat(100 * 1024);
                await cache.set(`key-${index}`, data);
            },
            config: { operations: 100 }, // 减少操作次数
        },
    ],
    /**
     * 批量操作测试
     */
    batchOperations: [
        {
            name: 'Batch Set (10项)',
            fn: async (cache, index) => {
                const items = Array.from({ length: 10 }, (_, i) => ({
                    key: `batch-${index}-${i}`,
                    value: `value-${i}`,
                }));
                await cache.mset(items);
            },
            config: { operations: 100 },
        },
        {
            name: 'Batch Get (10项)',
            fn: async (cache, index) => {
                // 预先设置
                if (index === 0) {
                    for (let i = 0; i < 100; i++) {
                        for (let j = 0; j < 10; j++) {
                            await cache.set(`batch-${i}-${j}`, `value-${j}`);
                        }
                    }
                }
                const keys = Array.from({ length: 10 }, (_, i) => `batch-${index}-${i}`);
                await cache.mget(keys);
            },
            config: { operations: 100 },
        },
    ],
    /**
     * TTL 测试
     */
    ttlOperations: [
        {
            name: 'Set (带 TTL)',
            fn: async (cache, index) => {
                await cache.set(`key-${index}`, `value-${index}`, { ttl: 60000 });
            },
        },
        {
            name: 'Get (过期检查)',
            fn: async (cache, index) => {
                // 预先设置带 TTL 的数据
                if (index === 0) {
                    for (let i = 0; i < 1000; i++) {
                        await cache.set(`key-${i}`, `value-${i}`, { ttl: 60000 });
                    }
                }
                await cache.get(`key-${index % 1000}`);
            },
        },
    ],
};
/**
 * 运行标准基准测试
 */
export async function runStandardBenchmarks(cache) {
    const benchmark = createBenchmark(cache);
    console.info('开始运行标准基准测试...');
    // 运行所有测试
    await benchmark.runSuite(standardBenchmarks.basicOperations);
    await benchmark.runSuite(standardBenchmarks.dataSizes);
    await benchmark.runSuite(standardBenchmarks.batchOperations);
    await benchmark.runSuite(standardBenchmarks.ttlOperations);
    // 生成报告
    console.info('\n测试完成！生成报告...');
    console.info(benchmark.generateReport());
}
//# sourceMappingURL=performance-benchmark.js.map