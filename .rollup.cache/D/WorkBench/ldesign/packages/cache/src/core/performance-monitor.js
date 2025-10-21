import { EventEmitter } from '../utils';
/**
 * 缓存性能监控器 (Performance Monitor)
 *
 * 专门用于收集和分析缓存操作的性能指标
 *
 * **与 PerformanceProfiler 的区别：**
 * - PerformanceMonitor（本模块）：专门用于缓存操作的性能监控，集成到 CacheManager
 * - PerformanceProfiler（utils/performance-profiler.ts）：通用性能分析工具
 *
 * **使用场景：**
 * - 自动监控所有缓存操作（get、set、remove等）
 * - 分析不同存储引擎的性能表现
 * - 追踪缓存命中率和操作成功率
 * - 识别慢缓存操作
 *
 * **主要功能：**
 * - 按引擎和操作类型统计性能
 * - 慢操作自动检测和报警
 * - 支持采样率控制
 * - 事件驱动的性能监控
 */
export class PerformanceMonitor {
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
            maxRecords: options.maxRecords ?? 1000,
            samplingRate: options.samplingRate ?? 1,
            detailed: options.detailed ?? false,
            collector: options.collector ?? (() => { }),
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
                        operation: 'unknown',
                        duration,
                        success,
                        error: error?.message,
                        timestamp: Date.now(),
                    };
                    this.record(metrics);
                }
            },
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
                ...context,
            });
            return result;
        }
        catch (error) {
            const duration = performance.now() - startTime;
            this.record({
                operation,
                duration,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
                ...context,
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
        // 维护最大记录数
        if (this.metrics.length >= this.options.maxRecords) {
            this.metrics.shift();
        }
        this.metrics.push(metrics);
        // 检查是否为慢操作
        if (metrics.duration > this.options.slowThreshold) {
            this.emitter.emit('slow', metrics);
        }
        // 调用自定义收集器
        this.options.collector(metrics);
        // 发出性能事件
        this.emitter.emit('metrics', metrics);
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
                slowOperations: [],
            };
        }
        const successCount = filtered.filter(m => m.success).length;
        const failureCount = filtered.filter(m => !m.success).length;
        const durations = filtered.map(m => m.duration);
        const totalDataSize = filtered.reduce((sum, m) => sum + (m.dataSize || 0), 0);
        // 操作分布
        const operationDistribution = {};
        filtered.forEach((m) => {
            operationDistribution[m.operation] = (operationDistribution[m.operation] || 0) + 1;
        });
        // 引擎分布
        const engineDistribution = {};
        filtered.forEach((m) => {
            if (m.engine) {
                engineDistribution[m.engine] = (engineDistribution[m.engine] || 0) + 1;
            }
        });
        // 慢操作
        const slowOperations = filtered.filter(m => m.duration > this.options.slowThreshold);
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
            slowOperations,
        };
    }
    /**
     * 获取百分位数
     */
    getPercentiles(percentiles = [50, 75, 90, 95, 99]) {
        const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
        if (durations.length === 0) {
            return Object.fromEntries(percentiles.map(p => [`p${p}`, 0]));
        }
        const result = {};
        percentiles.forEach((p) => {
            const index = Math.ceil((p / 100) * durations.length) - 1;
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
        // 维护最大记录数
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
=== 缓存性能报告 ===
时间: ${new Date().toISOString()}

概览:
- 总操作数: ${stats.totalOperations}
- 成功率: ${stats.totalOperations > 0 ? (stats.successCount / stats.totalOperations * 100).toFixed(2) : 0}%
- 平均耗时: ${stats.averageDuration.toFixed(2)}ms
- 最小/最大耗时: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms
- 总数据量: ${(stats.totalDataSize / 1024).toFixed(2)}KB

百分位数:
${Object.entries(percentiles).map(([k, v]) => `- ${k}: ${v.toFixed(2)}ms`).join('\n')}

操作分布:
${Object.entries(stats.operationDistribution).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

引擎分布:
${Object.entries(stats.engineDistribution).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

慢操作 (>${this.options.slowThreshold}ms): ${stats.slowOperations.length}
${stats.slowOperations.slice(0, 5).map(m => `  - ${m.operation} [${m.key}]: ${m.duration.toFixed(2)}ms`).join('\n')}
    `.trim();
    }
}
//# sourceMappingURL=performance-monitor.js.map