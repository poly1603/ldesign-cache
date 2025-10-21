import type { CacheManager } from '../core/cache-manager';
import type { SerializableValue } from '../types';
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
export interface BenchmarkConfig {
    name: string;
    operations?: number;
    warmup?: number;
    measureMemory?: boolean;
    dataGenerator?: (index: number) => SerializableValue;
}
export declare class PerformanceBenchmark {
    private cache;
    private results;
    constructor(cache: CacheManager);
    run(testFn: (cache: CacheManager, index: number) => Promise<void>, config: BenchmarkConfig): Promise<BenchmarkResult>;
    runSuite(tests: Array<{
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config?: Partial<BenchmarkConfig>;
    }>): Promise<BenchmarkResult[]>;
    generateReport(): string;
    compare(baseline: BenchmarkResult, current: BenchmarkResult): string;
    getResults(): BenchmarkResult[];
    clearResults(): void;
    private getMemoryUsage;
    private formatBytes;
    private delay;
}
export declare function createBenchmark(cache: CacheManager): PerformanceBenchmark;
export declare const standardBenchmarks: {
    basicOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
    }[];
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
    batchOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
        config: {
            operations: number;
        };
    }[];
    ttlOperations: {
        name: string;
        fn: (cache: CacheManager, index: number) => Promise<void>;
    }[];
};
export declare function runStandardBenchmarks(cache: CacheManager): Promise<void>;
//# sourceMappingURL=performance-benchmark.d.ts.map