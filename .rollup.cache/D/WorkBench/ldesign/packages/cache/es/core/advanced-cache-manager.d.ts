/**
 * 高级缓存管理器 - 支持分层缓存、分区和优先级管理
 */
import type { SerializableValue, SetOptions, StorageEngine } from '../types';
/**
 * 缓存层级配置
 */
export interface CacheTier {
    /** 层级名称 */
    name: string;
    /** 存储引擎 */
    engine: StorageEngine;
    /** 最大容量（字节） */
    maxSize: number;
    /** 默认TTL（毫秒） */
    defaultTTL?: number;
    /** 优先级（数字越小优先级越高） */
    priority: number;
}
/**
 * 缓存分区配置
 */
export interface CachePartition {
    /** 分区名称 */
    name: string;
    /** 键前缀或模式 */
    keyPattern: string | RegExp;
    /** 指定的缓存层级 */
    tiers?: string[];
    /** 最大项数 */
    maxItems?: number;
    /** 优先级 */
    priority?: 'high' | 'medium' | 'low';
}
/**
 * 缓存项优先级
 */
export declare enum CachePriority {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3
}
/**
 * 分层缓存管理器
 */
export declare class TieredCacheManager {
    private tiers;
    private tierOrder;
    constructor(tiers: CacheTier[]);
    /**
     * 分层设置缓存
     */
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        tier?: string;
    }): Promise<void>;
    /**
     * 分层获取缓存
     */
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    /**
     * 提升缓存项到更高层级
     */
    private promote;
    /**
     * 降级缓存项到更低层级
     */
    demote(key: string, fromTier: string, toTier: string): Promise<void>;
    /**
     * 获取所有层级的统计信息
     */
    getStats(): Promise<Map<string, any>>;
}
/**
 * 分区缓存管理器
 */
export declare class PartitionedCacheManager {
    private partitions;
    private partitionManagers;
    private defaultManager;
    constructor(partitions: CachePartition[], defaultConfig?: any);
    /**
     * 根据键选择分区
     */
    private selectPartition;
    /**
     * 设置缓存（自动路由到分区）
     */
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
    /**
     * 获取缓存（自动路由到分区）
     */
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    /**
     * 获取分区统计
     */
    getPartitionStats(): Promise<Map<string, any>>;
}
/**
 * 优先级感知缓存管理器
 */
export declare class PriorityCacheManager {
    private cache;
    private priorities;
    private priorityQueues;
    constructor(config?: any);
    /**
     * 设置带优先级的缓存
     */
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        priority?: CachePriority;
    }): Promise<void>;
    /**
     * 获取缓存并更新访问频率
     */
    get<T extends SerializableValue>(key: string): Promise<T | null>;
    /**
     * 提升优先级
     */
    private promotePriority;
    /**
     * 基于优先级的淘汰
     */
    evictByPriority(count: number): Promise<void>;
    /**
     * 获取优先级统计
     */
    getPriorityStats(): Map<CachePriority, number>;
}
/**
 * 成本感知缓存管理器
 */
export declare class CostAwareCacheManager {
    private cache;
    private costs;
    private values;
    constructor(config?: any);
    /**
     * 设置带成本的缓存
     */
    set<T extends SerializableValue>(key: string, value: T, options?: SetOptions & {
        cost?: number;
        value?: number;
    }): Promise<void>;
    /**
     * 基于价值/成本比的淘汰
     */
    evictByValueCostRatio(count: number): Promise<void>;
}
/**
 * 创建高级缓存管理器
 */
export declare function createAdvancedCacheManager(config: {
    type: 'tiered' | 'partitioned' | 'priority' | 'cost';
    tiers?: CacheTier[];
    partitions?: CachePartition[];
    options?: any;
}): TieredCacheManager | PartitionedCacheManager | PriorityCacheManager | CostAwareCacheManager;
