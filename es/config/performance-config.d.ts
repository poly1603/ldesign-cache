import type { ThrottleConfig } from '../utils/event-throttle';
import type { SerializationCacheConfig } from '../utils/serialization-cache';
export interface PerformanceOptimizationConfig {
    serializationCache?: SerializationCacheConfig;
    eventThrottle?: ThrottleConfig;
    batchOptimization?: boolean;
    memoryOptimization?: boolean;
    performanceMonitoring?: boolean;
}
export type PerformancePreset = 'low' | 'balanced' | 'high' | 'extreme';
export declare const PERFORMANCE_PRESETS: Record<PerformancePreset, PerformanceOptimizationConfig>;
export declare const DEFAULT_PERFORMANCE_CONFIG: PerformanceOptimizationConfig;
export declare class PerformanceConfigManager {
    private config;
    constructor(config?: PerformanceOptimizationConfig | PerformancePreset);
    getConfig(): Readonly<PerformanceOptimizationConfig>;
    updateConfig(config: Partial<PerformanceOptimizationConfig>): void;
    applyPreset(preset: PerformancePreset): void;
    reset(): void;
    getSerializationCacheConfig(): SerializationCacheConfig | undefined;
    getEventThrottleConfig(): ThrottleConfig | undefined;
    isBatchOptimizationEnabled(): boolean;
    isMemoryOptimizationEnabled(): boolean;
    isPerformanceMonitoringEnabled(): boolean;
    autoSelectPreset(): PerformancePreset;
    toJSON(): string;
    fromJSON(json: string): void;
}
export declare function createPerformanceConfig(config?: PerformanceOptimizationConfig | PerformancePreset): PerformanceConfigManager;
export declare const globalPerformanceConfig: PerformanceConfigManager;
export declare function getPerformanceConfig(): Readonly<PerformanceOptimizationConfig>;
export declare function updatePerformanceConfig(config: Partial<PerformanceOptimizationConfig>): void;
export declare function applyPerformancePreset(preset: PerformancePreset): void;
export declare function autoConfigurePerformance(): PerformancePreset;
//# sourceMappingURL=performance-config.d.ts.map