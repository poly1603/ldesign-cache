import type { StorageEngine } from '../types';
/**
 * 缓存统计组合式函数
 */
export declare function useCacheStats(options?: {
    /** 自动刷新间隔（毫秒） */
    refreshInterval?: number;
    /** 是否立即加载 */
    immediate?: boolean;
}): {
    stats: import("vue").ComputedRef<{
        totalItems: number;
        totalSize: number;
        engines: {
            localStorage: {
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
            sessionStorage: {
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
            cookie: {
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
            indexedDB: {
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
            memory: {
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
        };
        hitRate: number;
        expiredItems: number;
    } | null>;
    formattedStats: import("vue").ComputedRef<{
        totalSizeFormatted: string;
        hitRatePercentage: string;
        engines: {
            [k: string]: {
                sizeFormatted: string;
                hitRate: string;
                itemCount: number;
                size: number;
                available: boolean;
                hits: number;
                misses: number;
            };
        };
        totalItems: number;
        totalSize: number;
        hitRate: number;
        expiredItems: number;
    } | null>;
    engineUsage: import("vue").ComputedRef<{
        engine: StorageEngine;
        itemCount: number;
        size: number;
        sizeFormatted: string;
        available: boolean;
        usage: string;
    }[]>;
    performanceMetrics: import("vue").ComputedRef<{
        totalRequests: number;
        hitRate: number;
        hitRatePercentage: string;
        missRate: number;
        missRatePercentage: string;
        averageItemSize: string;
    } | null>;
    loading: import("vue").ComputedRef<boolean>;
    error: import("vue").ComputedRef<Error | null>;
    refresh: () => Promise<void>;
    cleanupAndRefresh: () => Promise<void>;
    startAutoRefresh: (interval: number) => void;
    stopAutoRefresh: () => void;
    manager: import("..").CacheManager;
};
