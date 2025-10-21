import type { StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
/**
 * 缓存分析配置
 */
export interface AnalyzerConfig {
    /** 是否启用分析 */
    enabled?: boolean;
    /** 采样率（0-1） */
    sampleRate?: number;
    /** 分析间隔（毫秒） */
    interval?: number;
    /** 最大记录数 */
    maxRecords?: number;
    /** 是否记录值 */
    recordValues?: boolean;
}
/**
 * 访问模式
 */
export interface AccessPattern {
    /** 键名 */
    key: string;
    /** 访问次数 */
    accessCount: number;
    /** 命中次数 */
    hitCount: number;
    /** 未命中次数 */
    missCount: number;
    /** 平均访问间隔（毫秒） */
    avgInterval: number;
    /** 最后访问时间 */
    lastAccess: number;
    /** 数据大小 */
    size?: number;
    /** 存储引擎 */
    engine?: StorageEngine;
}
/**
 * 性能指标
 */
export interface PerformanceMetrics {
    /** 操作类型 */
    operation: 'get' | 'set' | 'remove' | 'clear';
    /** 平均耗时（毫秒） */
    avgDuration: number;
    /** 最小耗时 */
    minDuration: number;
    /** 最大耗时 */
    maxDuration: number;
    /** 操作次数 */
    count: number;
    /** P95 耗时 */
    p95Duration: number;
    /** P99 耗时 */
    p99Duration: number;
}
/**
 * 存储分析
 */
export interface StorageAnalysis {
    /** 引擎名称 */
    engine: StorageEngine;
    /** 使用率 */
    usage: number;
    /** 项目数 */
    itemCount: number;
    /** 总大小 */
    totalSize: number;
    /** 平均项大小 */
    avgItemSize: number;
    /** 最大项大小 */
    maxItemSize: number;
    /** 过期项数 */
    expiredCount: number;
}
/**
 * 优化建议
 */
export interface OptimizationSuggestion {
    /** 类型 */
    type: 'performance' | 'storage' | 'strategy' | 'config';
    /** 严重程度 */
    severity: 'low' | 'medium' | 'high';
    /** 标题 */
    title: string;
    /** 描述 */
    description: string;
    /** 建议操作 */
    recommendation: string;
    /** 影响的键 */
    affectedKeys?: string[];
}
/**
 * 分析报告
 */
export interface AnalysisReport {
    /** 生成时间 */
    timestamp: number;
    /** 分析周期 */
    period: {
        start: number;
        end: number;
        duration: number;
    };
    /** 总体统计 */
    summary: {
        totalOperations: number;
        hitRate: number;
        avgResponseTime: number;
        errorRate: number;
    };
    /** 访问模式 */
    accessPatterns: {
        hot: AccessPattern[];
        cold: AccessPattern[];
        frequent: AccessPattern[];
    };
    /** 性能指标 */
    performance: PerformanceMetrics[];
    /** 存储分析 */
    storage: StorageAnalysis[];
    /** 优化建议 */
    suggestions: OptimizationSuggestion[];
}
/**
 * 缓存分析器
 *
 * 提供缓存使用分析和优化建议
 */
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
    /**
     * 附加事件监听器
     */
    private attachListeners;
    /**
     * 处理 get 事件
     */
    private handleGet;
    /**
     * 处理 set 事件
     */
    private handleSet;
    /**
     * 处理 remove 事件
     */
    private handleRemove;
    /**
     * 处理错误事件
     */
    private handleError;
    /**
     * 是否应该采样
     */
    private shouldSample;
    /**
     * 获取或创建访问模式
     */
    private getOrCreatePattern;
    /**
     * 更新访问时间
     */
    private updateAccessTime;
    /**
     * 记录性能数据
     */
    private recordPerformance;
    /**
     * 开始定期分析
     */
    private startAnalysis;
    /**
     * 执行分析
     */
    private performAnalysis;
    /**
     * 生成分析报告
     */
    generateReport(): Promise<AnalysisReport>;
    /**
     * 识别热键
     */
    private identifyHotKeys;
    /**
     * 识别冷键
     */
    private identifyColdKeys;
    /**
     * 识别频繁访问键
     */
    private identifyFrequentKeys;
    /**
     * 计算性能指标
     */
    private calculatePerformanceMetrics;
    /**
     * 分析存储
     */
    private analyzeStorage;
    /**
     * 生成优化建议
     */
    private generateSuggestions;
    /**
     * 计算平均响应时间
     */
    private calculateAvgResponseTime;
    /**
     * 计算错误率
     */
    private calculateErrorRate;
    /**
     * 重置分析数据
     */
    reset(): void;
    /**
     * 销毁分析器
     */
    destroy(): void;
}
/**
 * 创建缓存分析器
 */
export declare function createCacheAnalyzer(cache: CacheManager, config?: AnalyzerConfig): CacheAnalyzer;
