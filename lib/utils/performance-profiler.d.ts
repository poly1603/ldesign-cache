export interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    count: number;
    tags?: Record<string, string>;
}
export interface PerformanceStats {
    name: string;
    totalCalls: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
    opsPerSecond: number;
}
export interface ProfilerConfig {
    enabled?: boolean;
    maxRecords?: number;
    autoReport?: boolean;
    reportInterval?: number;
    verbose?: boolean;
}
export declare class PerformanceProfiler {
    private config;
    private metrics;
    private activeMetrics;
    private reportTimer?;
    constructor(config?: ProfilerConfig);
    start(name: string, tags?: Record<string, string>): PerformanceMetric;
    end(metric: PerformanceMetric): void;
    private recordMetric;
    measure<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T;
    getStats(name: string): PerformanceStats | null;
    getAllStats(): PerformanceStats[];
    generateReport(topN?: number): string;
    private identifyBottlenecks;
    clear(): void;
    exportData(): string;
    private startAutoReport;
    stopAutoReport(): void;
    updateConfig(config: Partial<ProfilerConfig>): void;
    destroy(): void;
}
export declare function createProfiler(config?: ProfilerConfig): PerformanceProfiler;
export declare const globalProfiler: PerformanceProfiler;
export declare function enableProfiling(): void;
export declare function disableProfiling(): void;
export declare function generateGlobalReport(): string;
//# sourceMappingURL=performance-profiler.d.ts.map