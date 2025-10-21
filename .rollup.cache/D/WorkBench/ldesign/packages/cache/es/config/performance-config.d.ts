/**
 * 性能优化配置模块
 *
 * 提供全局性能优化配置和预设
 */
import type { ThrottleConfig } from '../utils/event-throttle';
import type { SerializationCacheConfig } from '../utils/serialization-cache';
/**
 * 性能优化配置接口
 */
export interface PerformanceOptimizationConfig {
    /** 序列化缓存配置 */
    serializationCache?: SerializationCacheConfig;
    /** 事件节流配置 */
    eventThrottle?: ThrottleConfig;
    /** 是否启用批量操作优化 */
    batchOptimization?: boolean;
    /** 是否启用内存优化 */
    memoryOptimization?: boolean;
    /** 是否启用性能监控 */
    performanceMonitoring?: boolean;
}
/**
 * 性能预设类型
 */
export type PerformancePreset = 'low' | 'balanced' | 'high' | 'extreme';
/**
 * 预设配置映射
 */
export declare const PERFORMANCE_PRESETS: Record<PerformancePreset, PerformanceOptimizationConfig>;
/**
 * 默认性能配置
 */
export declare const DEFAULT_PERFORMANCE_CONFIG: PerformanceOptimizationConfig;
/**
 * 性能配置管理器
 */
export declare class PerformanceConfigManager {
    private config;
    constructor(config?: PerformanceOptimizationConfig | PerformancePreset);
    /**
     * 获取当前配置
     */
    getConfig(): Readonly<PerformanceOptimizationConfig>;
    /**
     * 更新配置
     */
    updateConfig(config: Partial<PerformanceOptimizationConfig>): void;
    /**
     * 应用预设
     */
    applyPreset(preset: PerformancePreset): void;
    /**
     * 重置为默认配置
     */
    reset(): void;
    /**
     * 获取序列化缓存配置
     */
    getSerializationCacheConfig(): SerializationCacheConfig | undefined;
    /**
     * 获取事件节流配置
     */
    getEventThrottleConfig(): ThrottleConfig | undefined;
    /**
     * 检查是否启用批量操作优化
     */
    isBatchOptimizationEnabled(): boolean;
    /**
     * 检查是否启用内存优化
     */
    isMemoryOptimizationEnabled(): boolean;
    /**
     * 检查是否启用性能监控
     */
    isPerformanceMonitoringEnabled(): boolean;
    /**
     * 根据环境自动选择预设
     */
    autoSelectPreset(): PerformancePreset;
    /**
     * 导出配置为JSON
     */
    toJSON(): string;
    /**
     * 从JSON加载配置
     */
    fromJSON(json: string): void;
}
/**
 * 创建性能配置管理器
 */
export declare function createPerformanceConfig(config?: PerformanceOptimizationConfig | PerformancePreset): PerformanceConfigManager;
/**
 * 全局性能配置实例
 */
export declare const globalPerformanceConfig: PerformanceConfigManager;
/**
 * 获取当前性能配置
 */
export declare function getPerformanceConfig(): Readonly<PerformanceOptimizationConfig>;
/**
 * 更新全局性能配置
 */
export declare function updatePerformanceConfig(config: Partial<PerformanceOptimizationConfig>): void;
/**
 * 应用性能预设
 */
export declare function applyPerformancePreset(preset: PerformancePreset): void;
/**
 * 自动配置性能
 */
export declare function autoConfigurePerformance(): PerformancePreset;
