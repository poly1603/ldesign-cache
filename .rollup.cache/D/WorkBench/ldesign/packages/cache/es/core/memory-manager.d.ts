/**
 * 内存管理器 - 提供内存监控、压力检测和自动清理功能
 */
import type { SerializableValue, StorageEngine } from '../types';
/**
 * 内存使用统计
 */
export interface MemoryStats {
    /** 总内存使用量（字节） */
    totalUsed: number;
    /** 内存限制（字节） */
    limit: number;
    /** 使用百分比 */
    usagePercentage: number;
    /** 各引擎内存使用 */
    engineUsage: Map<StorageEngine, number>;
    /** 缓存项数量 */
    itemCount: number;
    /** 内存压力级别 */
    pressureLevel: 'low' | 'medium' | 'high' | 'critical';
    /** 最后清理时间 */
    lastCleanupTime: number;
    /** 清理次数 */
    cleanupCount: number;
}
/**
 * 内存管理配置
 */
export interface MemoryManagerConfig {
    /** 最大内存限制（字节） */
    maxMemory?: number;
    /** 高压力阈值（百分比） */
    highPressureThreshold?: number;
    /** 危急压力阈值（百分比） */
    criticalPressureThreshold?: number;
    /** 自动清理间隔（毫秒） */
    autoCleanupInterval?: number;
    /** 启用自动压力响应 */
    enableAutoPressureResponse?: boolean;
}
/**
 * 内存管理器
 */
export declare class MemoryManager {
    private config;
    private currentUsage;
    private engineUsage;
    private itemCount;
    private cleanupCount;
    private lastCleanupTime;
    private cleanupTimer?;
    private metadataPool;
    private cacheItemPool;
    private objectSizeCache;
    private pressureCallbacks;
    constructor(config?: MemoryManagerConfig);
    /**
     * 更新内存使用量
     */
    updateUsage(delta: number, engine?: StorageEngine): void;
    /**
     * 更新项目计数
     */
    updateItemCount(delta: number): void;
    /**
     * 获取内存统计
     */
    getStats(): MemoryStats;
    /**
     * 获取压力级别
     */
    private getPressureLevel;
    /**
     * 检查内存压力并触发响应
     */
    private checkMemoryPressure;
    /**
     * 执行清理
     */
    private performCleanup;
    /**
     * 紧急清理
     */
    private emergencyCleanup;
    /**
     * 启动自动清理
     */
    private startAutoCleanup;
    /**
     * 计算对象大小（优化版）
     */
    calculateObjectSize(obj: SerializableValue): number;
    /**
     * 计算字符串大小（UTF-8）优化版本
     */
    private calculateStringSize;
    /**
     * 注册压力监听器
     */
    onPressure(callback: (level: MemoryStats['pressureLevel']) => void): () => void;
    /**
     * 获取对象池中的元数据对象
     */
    acquireMetadata(): any;
    /**
     * 释放元数据对象到池中
     */
    releaseMetadata(obj: any): void;
    /**
     * 获取对象池中的缓存项对象
     */
    acquireCacheItem(): any;
    /**
     * 释放缓存项对象到池中
     */
    releaseCacheItem(obj: any): void;
    /**
     * 检查是否有足够的内存
     */
    hasEnoughMemory(required: number): boolean;
    /**
     * 请求内存分配
     */
    requestMemory(size: number): boolean;
    /**
     * 重置内存统计
     */
    reset(): void;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
/**
 * 创建内存管理器实例
 */
export declare function createMemoryManager(config?: MemoryManagerConfig): MemoryManager;
