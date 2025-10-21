import type { SerializableValue, SetOptions, StorageEngine } from '../types';
export interface CacheTier {
    name: string;
    engine: StorageEngine;
    maxSize: number;
    defaultTTL?: number;
    priority: number;
}
export interface CachePartition {
    name: string;
    keyPattern: string | RegExp;
    tiers?: string[];
    maxItems?: number;
    priority?: 'high' | 'medium' | 'low';
}
export declare enum CachePriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3
}
export declare class TieredCacheManager {
    private tiers;
    private tierOrder;
    constructor(tiers: CacheTier[]);
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        tier?: string;
    }): Promise<void>;
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    private promote;
    demote(key: string, fromTier: string, toTier: string): Promise<void>;
    getStats(): Promise<Map<string, any>>;
}
export declare class PartitionedCacheManager {
    private partitions;
    private partitionManagers;
    private defaultManager;
    constructor(partitions: CachePartition[], defaultConfig?: any);
    private selectPartition;
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    getPartitionStats(): Promise<Map<string, any>>;
}
export declare class PriorityCacheManager {
    private cache;
    private priorities;
    private priorityQueues;
    constructor(config?: any);
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        priority?: CachePriority;
    }): Promise<void>;
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    private promotePriority;
    evictByPriority(count: number): Promise<void>;
    getPriorityStats(): Map<CachePriority, number>;
}
export declare class CostAwareCacheManager {
    private cache;
    private costs;
    private values;
    constructor(config?: any);
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        cost?: number;
        value?: number;
    }): Promise<void>;
    evictByValueCostRatio(count: number): Promise<void>;
}
export declare function createAdvancedCacheManager(config: {
    type: 'tiered' | 'partitioned' | 'priority' | 'cost';
    tiers?: CacheTier[];
    partitions?: CachePartition[];
    options?: any;
}): TieredCacheManager | PartitionedCacheManager | PriorityCacheManager | CostAwareCacheManager;
//# sourceMappingURL=advanced-cache-manager.d.ts.map