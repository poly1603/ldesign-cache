import type { StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
export interface AnalyzerConfig {
    enabled?: boolean;
    sampleRate?: number;
    interval?: number;
    maxRecords?: number;
    recordValues?: boolean;
}
export interface AccessPattern {
    key: string;
    accessCount: number;
    hitCount: number;
    missCount: number;
    avgInterval: number;
    lastAccess: number;
    size?: number;
    engine?: StorageEngine;
}
export interface PerformanceMetrics {
    operation: 'get' | 'set' | 'remove' | 'clear';
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    count: number;
    p95Duration: number;
    p99Duration: number;
}
export interface StorageAnalysis {
    engine: StorageEngine;
    usage: number;
    itemCount: number;
    totalSize: number;
    avgItemSize: number;
    maxItemSize: number;
    expiredCount: number;
}
export interface OptimizationSuggestion {
    type: 'performance' | 'storage' | 'strategy' | 'config';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    recommendation: string;
    affectedKeys?: string[];
}
export interface AnalysisReport {
    timestamp: number;
    period: {
        start: number;
        end: number;
        duration: number;
    };
    summary: {
        totalOperations: number;
        hitRate: number;
        avgResponseTime: number;
        errorRate: number;
    };
    accessPatterns: {
        hot: AccessPattern[];
        cold: AccessPattern[];
        frequent: AccessPattern[];
    };
    performance: PerformanceMetrics[];
    storage: StorageAnalysis[];
    suggestions: OptimizationSuggestion[];
}
export declare class CacheAnalyzer {
    private cache;
    private enabled;
    private sampleRate;
    private maxRecords;
    private recordValues;
    private accessRecords;
    private performanceRecords;
    private errorRecords;
    private analysisTimer?;
    private startTime;
    constructor(cache: CacheManager, config?: AnalyzerConfig);
    private attachListeners;
    private handleGet;
    private handleSet;
    private handleRemove;
    private handleError;
    private shouldSample;
    private getOrCreatePattern;
    private updateAccessTime;
    private recordPerformance;
    private startAnalysis;
    private performAnalysis;
    generateReport(): Promise<AnalysisReport>;
    private identifyHotKeys;
    private identifyColdKeys;
    private identifyFrequentKeys;
    private calculatePerformanceMetrics;
    private analyzeStorage;
    private generateSuggestions;
    private calculateAvgResponseTime;
    private calculateErrorRate;
    reset(): void;
    destroy(): void;
}
export declare function createCacheAnalyzer(cache: CacheManager, config?: AnalyzerConfig): CacheAnalyzer;
//# sourceMappingURL=cache-analyzer.d.ts.map