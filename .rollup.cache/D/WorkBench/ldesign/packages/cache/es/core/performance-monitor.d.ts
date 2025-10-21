import type { StorageEngine } from '../types';
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    /** 操作类型 */
    operation: string;
    /** 存储引擎 */
    engine?: StorageEngine;
    /** 键名 */
    key?: string;
    /** 耗时（毫秒） */
    duration: number;
    /** 数据大小（字节） */
    dataSize?: number;
    /** 是否成功 */
    success: boolean;
    /** 错误信息 */
    error?: string;
    /** 时间戳 */
    timestamp: number;
}
/**
 * 性能统计
 */
export interface PerformanceStats {
    /** 总操作次数 */
    totalOperations: number;
    /** 成功次数 */
    successCount: number;
    /** 失败次数 */
    failureCount: number;
    /** 平均耗时 */
    averageDuration: number;
    /** 最小耗时 */
    minDuration: number;
    /** 最大耗时 */
    maxDuration: number;
    /** 总数据量 */
    totalDataSize: number;
    /** 操作分布 */
    operationDistribution: Record<string, number>;
    /** 引擎分布 */
    engineDistribution: Record<StorageEngine, number>;
    /** 慢操作（超过阈值） */
    slowOperations: PerformanceMetrics[];
}
/**
 * 性能监控器配置
 */
export interface PerformanceMonitorOptions {
    /** 是否启用 */
    enabled?: boolean;
    /** 慢操作阈值（毫秒） */
    slowThreshold?: number;
    /** 最大记录数 */
    maxRecords?: number;
    /** 采样率（0-1） */
    samplingRate?: number;
    /** 是否记录详细信息 */
    detailed?: boolean;
    /** 自定义收集器 */
    collector?: (metrics: PerformanceMetrics) => void;
}
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
export declare class PerformanceMonitor {
    private metrics;
    private readonly emitter;
    private readonly options;
    constructor(options?: PerformanceMonitorOptions);
    /**
     * 开始测量
     */
    startMeasure(): {
        end: (success: boolean, error?: Error) => void;
    };
    /**
     * 测量异步操作
     */
    measure<T>(operation: string, fn: () => Promise<T>, context?: {
        key?: string;
        engine?: StorageEngine;
        dataSize?: number;
    }): Promise<T>;
    /**
     * 记录性能指标
     */
    record(metrics: PerformanceMetrics): void;
    /**
     * 判断是否应该记录
     */
    private shouldRecord;
    /**
     * 获取统计信息
     */
    getStats(filter?: {
        operation?: string;
        engine?: StorageEngine;
        since?: number;
    }): PerformanceStats;
    /**
     * 获取百分位数
     */
    getPercentiles(percentiles?: number[]): Record<string, number>;
    /**
     * 清空记录
     */
    clear(): void;
    /**
     * 导出指标
     */
    export(): PerformanceMetrics[];
    /**
     * 导入指标
     */
    import(metrics: PerformanceMetrics[]): void;
    /**
     * 监听事件
     */
    on(event: 'metrics' | 'slow', listener: (metrics: PerformanceMetrics) => void): void;
    /**
     * 移除监听器
     */
    off(event: 'metrics' | 'slow', listener: (metrics: PerformanceMetrics) => void): void;
    /**
     * 生成报告
     */
    generateReport(): string;
}
