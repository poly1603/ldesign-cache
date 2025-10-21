/**
 * 性能基准测试套件
 *
 * 提供全面的性能测试工具，用于验证优化效果
 */
import type { CacheManager } from '../core/cache-manager';
import type { SerializableValue } from '../types';
/**
 * 基准测试结果
 */
export interface BenchmarkResult {
    name: string;
    operations: number;
    duration: number;
    opsPerSecond: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    memoryUsed?: number;
}
/**
 * 基准测试配置
 */
export interface BenchmarkConfig {
    /** 测试名称 */
    name: string;
    /** 操作次数 */
    operations?: number;
    /** 预热次数 */
    warmup?: number;
    /** 是否测量内存 */
    measureMemory?: boolean;
    /** 测试数据生成器 */
    dataGenerator?: (index: number) => SerializableValue;
}
/**
 * 性能基准测试器
 */
export declare class PerformanceBenchmark {
    private cache;
    private results;
    constructor(cache: CacheManager);
    /**
     * 运行基准测试
     */
    run(testFn: (cache: CacheManager, index: number) => Promise<void>, config: BenchmarkConfig): Promise<BenchmarkResult>;
    /**
     * 运行一组基准测试
     */
    runSuite(tests: Array<{
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config?: Partial<BenchmarkConfig>;
    }>): Promise<BenchmarkResult[]>;
    /**
     * 生成性能报告
     */
    generateReport(): string;
    /**
     * 比较两个基准测试结果
     */
    compare(baseline: BenchmarkResult, current: BenchmarkResult): string;
    /**
     * 获取所有结果
     */
    getResults(): BenchmarkResult[];
    /**
     * 清除结果
     */
    clearResults(): void;
    /**
     * 获取内存使用情况
     */
    private getMemoryUsage;
    /**
     * 格式化字节大小
     */
    private formatBytes;
    /**
     * 延迟
     */
    private delay;
}
/**
 * 创建性能基准测试器
 */
export declare function createBenchmark(cache: CacheManager): PerformanceBenchmark;
/**
 * 预定义的基准测试套件
 */
export declare const standardBenchmarks: {
    /**
     * 基础操作测试
     */
    basicOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
    }[];
    /**
     * 不同数据大小测试
     */
    dataSizes: ({
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config?: undefined;
    } | {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config: {
            operations: number;
        };
    })[];
    /**
     * 批量操作测试
     */
    batchOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config: {
            operations: number;
        };
    }[];
    /**
     * TTL 测试
     */
    ttlOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
    }[];
};
/**
 * 运行标准基准测试
 */
export declare function runStandardBenchmarks(cache: CacheManager): Promise<void>;
