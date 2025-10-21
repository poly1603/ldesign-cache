/**
 * 性能分析工具 (Performance Profiler)
 *
 * 通用的性能分析器，用于任意操作的性能监控和瓶颈识别
 *
 * **与 PerformanceMonitor 的区别：**
 * - PerformanceProfiler（本模块）：通用性能分析工具，可用于任何操作的性能测量
 * - PerformanceMonitor（core/performance-monitor.ts）：专门用于缓存操作的性能监控
 *
 * **使用场景：**
 * - 需要分析非缓存操作的性能时使用 PerformanceProfiler
 * - 需要监控缓存操作性能时使用 PerformanceMonitor
 * - 需要识别性能瓶颈和生成详细报告时使用 PerformanceProfiler
 *
 * **主要功能：**
 * - 详细的性能指标收集（P50/P95/P99 延迟）
 * - 性能瓶颈自动识别
 * - 格式化的性能报告生成
 * - 支持自动定期报告
 */
/**
 * 性能度量记录
 */
export interface PerformanceMetric {
    /** 操作名称 */
    name: string;
    /** 开始时间 */
    startTime: number;
    /** 结束时间 */
    endTime?: number;
    /** 持续时间（毫秒） */
    duration?: number;
    /** 调用次数 */
    count: number;
    /** 标签 */
    tags?: Record<string, string>;
}
/**
 * 性能统计
 */
export interface PerformanceStats {
    /** 操作名称 */
    name: string;
    /** 总调用次数 */
    totalCalls: number;
    /** 总耗时 */
    totalDuration: number;
    /** 平均耗时 */
    avgDuration: number;
    /** 最小耗时 */
    minDuration: number;
    /** 最大耗时 */
    maxDuration: number;
    /** P50 延迟 */
    p50: number;
    /** P95 延迟 */
    p95: number;
    /** P99 延迟 */
    p99: number;
    /** 每秒操作数 */
    opsPerSecond: number;
}
/**
 * 性能分析器配置
 */
export interface ProfilerConfig {
    /** 是否启用 */
    enabled?: boolean;
    /** 最大记录数 */
    maxRecords?: number;
    /** 是否自动报告 */
    autoReport?: boolean;
    /** 报告间隔（毫秒） */
    reportInterval?: number;
    /** 是否记录详细信息 */
    verbose?: boolean;
}
/**
 * 性能分析器类
 *
 * @example
 * ```typescript
 * const profiler = new PerformanceProfiler({ enabled: true })
 *
 * // 记录操作
 * const metric = profiler.start('cacheGet')
 * // ... 执行操作 ...
 * profiler.end(metric)
 *
 * // 生成报告
 * )
 * ```
 */
export declare class PerformanceProfiler {
    /** 配置 */
    private config;
    /** 指标记录 */
    private metrics;
    /** 活动指标 */
    private activeMetrics;
    /** 报告定时器 */
    private reportTimer?;
    constructor(config?: ProfilerConfig);
    /**
     * 开始记录操作
     *
     * @param name - 操作名称
     * @param tags - 可选标签
     * @returns 性能度量对象
     */
    start(name: string, tags?: Record<string, string>): PerformanceMetric;
    /**
     * 结束记录操作
     *
     * @param metric - 性能度量对象
     */
    end(metric: PerformanceMetric): void;
    /**
     * 记录度量
     *
     * @param metric - 性能度量
     */
    private recordMetric;
    /**
     * 测量异步操作
     *
     * @param name - 操作名称
     * @param fn - 要测量的函数
     * @param tags - 可选标签
     * @returns 函数返回值
     */
    measure<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    /**
     * 测量同步操作
     *
     * @param name - 操作名称
     * @param fn - 要测量的函数
     * @param tags - 可选标签
     * @returns 函数返回值
     */
    measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T;
    /**
     * 获取操作统计
     *
     * @param name - 操作名称
     * @returns 统计信息，如果没有记录则返回 null
     */
    getStats(name: string): PerformanceStats | null;
    /**
     * 获取所有统计
     */
    getAllStats(): PerformanceStats[];
    /**
     * 生成性能报告
     *
     * @param topN - 显示前 N 个最慢的操作
     * @returns 报告字符串
     */
    generateReport(topN?: number): string;
    /**
     * 识别性能瓶颈
     *
     * @param stats - 统计信息数组
     * @returns 瓶颈描述数组
     */
    private identifyBottlenecks;
    /**
     * 清除所有记录
     */
    clear(): void;
    /**
     * 导出数据为 JSON
     */
    exportData(): string;
    /**
     * 启动自动报告
     */
    private startAutoReport;
    /**
     * 停止自动报告
     */
    stopAutoReport(): void;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<ProfilerConfig>): void;
    /**
     * 销毁分析器
     */
    destroy(): void;
}
/**
 * 创建性能分析器
 *
 * @param config - 配置选项
 * @returns 性能分析器实例
 */
export declare function createProfiler(config?: ProfilerConfig): PerformanceProfiler;
/**
 * 全局性能分析器实例
 */
export declare const globalProfiler: PerformanceProfiler;
/**
 * 启用全局性能分析
 */
export declare function enableProfiling(): void;
/**
 * 禁用全局性能分析
 */
export declare function disableProfiling(): void;
/**
 * 生成全局性能报告
 */
export declare function generateGlobalReport(): string;
