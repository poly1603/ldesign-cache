import type { StorageEngine } from '../types';
export interface PerformanceMetrics {
    operation: string;
    engine?: StorageEngine;
    key?: string;
    duration: number;
    dataSize?: number;
    success: boolean;
    error?: string;
    timestamp: number;
}
export interface PerformanceStats {
    totalOperations: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    totalDataSize: number;
    operationDistribution: Record<string, number>;
    engineDistribution: Record<StorageEngine, number>;
    slowOperations: PerformanceMetrics[];
}
export interface PerformanceMonitorOptions {
    enabled?: boolean;
    slowThreshold?: number;
    maxRecords?: number;
    samplingRate?: number;
    detailed?: boolean;
    collector?: (metrics: PerformanceMetrics) => void;
}
export declare class PerformanceMonitor {
    private metrics;
    private readonly emitter;
    private readonly options;
    constructor(options?: PerformanceMonitorOptions);
    startMeasure(): {
        end: (success: boolean, error?: Error) => void;
    };
    measure<T>(operation: string, fn: () => Promise<T>, context?: {
        key?: string;
        engine?: StorageEngine;
        dataSize?: number;
    }): Promise<T>;
    record(metrics: PerformanceMetrics): void;
    private shouldRecord;
    getStats(filter?: {
        operation?: string;
        engine?: StorageEngine;
        since?: number;
    }): PerformanceStats;
    getPercentiles(percentiles?: number[]): Record<string, number>;
    clear(): void;
    export(): PerformanceMetrics[];
    import(metrics: PerformanceMetrics[]): void;
    on(event: 'metrics' | 'slow', listener: (metrics: PerformanceMetrics) => void): void;
    off(event: 'metrics' | 'slow', listener: (metrics: PerformanceMetrics) => void): void;
    generateReport(): string;
}
//# sourceMappingURL=performance-monitor.d.ts.map