import type { StorageEngineConfig } from '../types';
import { BaseStorageEngine } from './base-engine';
/**
 * 内存缓存项接口
 *
 * 定义存储在内存中的缓存项的数据结构
 */
interface MemoryCacheItem {
    /** 缓存值（已序列化的字符串） */
    value: string;
    /** 创建时间戳 */
    createdAt: number;
    /** 过期时间戳（可选） */
    expiresAt?: number;
}
/**
 * 内存存储引擎
 *
 * 基于 JavaScript Map 实现的高性能内存缓存引擎
 * 特点：
 * - 访问速度最快
 * - 支持自动过期清理
 * - 支持内存大小限制
 * - 进程重启后数据丢失
 *
 * @example
 * ```typescript
 * const engine = new MemoryEngine({
 *   maxSize: 50 * 1024 * 1024, // 50MB
 *   cleanupInterval: 30000      // 30秒清理一次
 * })
 *
 * await engine.setItem('key', 'value', 3600000) // 1小时TTL
 * const value = await engine.getItem('key')
 * ```
 */
export declare class MemoryEngine extends BaseStorageEngine {
    /** 引擎名称标识 */
    readonly name: "memory";
    /** 引擎可用性（内存引擎始终可用） */
    readonly available = true;
    /** 最大内存大小限制（字节） */
    readonly maxSize: number;
    /** 最大项数限制 */
    private readonly maxItems;
    /** 淘汰策略 */
    private evictionStrategy;
    /** 内存存储容器 */
    private storage;
    /** 清理定时器ID */
    private cleanupTimer?;
    /** 淘汰计数 */
    private evictionCount;
    /** 大小计算缓存（LRU缓存） */
    private sizeCache;
    /** 大小缓存的最大条目数 */
    private readonly SIZE_CACHE_LIMIT;
    /**
     * 构造函数
     *
     * @param config - 内存引擎配置选项
     */
    constructor(config?: StorageEngineConfig['memory']);
    /**
     * 启动清理定时器
     *
     * 创建定期清理过期缓存项的定时器，兼容浏览器和Node.js环境
     *
     * @param interval - 清理间隔时间（毫秒）
     */
    private startCleanupTimer;
    /**
     * 设置缓存项
     *
     * 将键值对存储到内存中，支持TTL过期时间和内存大小检查
     *
     * @param key - 缓存键
     * @param value - 缓存值（字符串格式）
     * @param ttl - 生存时间（毫秒），可选
     * @throws {Error} 当内存不足时抛出错误
     *
     * @example
     * ```typescript
     * // 设置永久缓存
     * await engine.setItem('user:123', JSON.stringify(userData))
     *
     * // 设置带TTL的缓存
     * await engine.setItem('session:abc', sessionData, 3600000) // 1小时
     * ```
     */
    setItem(key: string, value: string, ttl?: number): Promise<void>;
    /**
     * 获取缓存项
     */
    getItem(key: string): Promise<string | null>;
    /**
     * 获取缓存项（别名，用于测试兼容）
     */
    get(key: string): Promise<string | null>;
    /**
     * 设置缓存项（别名，用于测试兼容）
     */
    set(key: string, value: string, options?: {
        ttl?: number;
    }): Promise<void>;
    /**
     * 删除缓存项
     */
    removeItem(key: string): Promise<void>;
    /**
     * 清空所有缓存项
     */
    clear(): Promise<void>;
    /**
     * 获取所有键名
     */
    keys(): Promise<string[]>;
    /**
     * 检查键是否存在
     */
    hasItem(key: string): Promise<boolean>;
    /**
     * 获取缓存项数量
     */
    length(): Promise<number>;
    /**
     * 清理过期项
     */
    cleanup(): Promise<void>;
    /**
     * 快速计算字符串大小（字节）
     * 优化版本：
     * 1. 使用LRU缓存避免重复计算相同字符串
     * 2. 使用更高效的UTF-8字节计算
     *
     * UTF-8编码规则：
     * - ASCII字符（0-127）：1字节
     * - 其他字符：平均3字节（简化估算）
     */
    private calculateSizeFast;
    /**
     * 根据策略淘汰一个项
     */
    private evictByStrategy;
    /**
     * 淘汰项直到有足够空间
     */
    private evictUntilSpaceAvailable;
    /**
     * 清理最旧的项以释放空间
     */
    private evictOldestItems;
    /**
     * 更新使用大小（完整重新计算）
     * 注意：此方法现在主要用于初始化或校验，日常操作使用增量更新
     */
    protected updateUsedSize(): Promise<void>;
    /**
     * 获取缓存项详细信息
     */
    getItemInfo(key: string): Promise<MemoryCacheItem | null>;
    /**
     * 获取所有缓存项（用于调试）
     */
    getAllItems(): Promise<Record<string, MemoryCacheItem>>;
    /**
     * 设置淘汰策略
     */
    setEvictionStrategy(strategyName: string): void;
    /**
     * 获取淘汰统计
     */
    getEvictionStats(): {
        totalEvictions: number;
        strategy: string;
        strategyStats: Record<string, any>;
    };
    /**
     * 获取存储统计
     */
    getStorageStats(): Promise<{
        totalItems: number;
        totalSize: number;
        expiredItems: number;
        oldestItem?: {
            key: string;
            age: number;
        };
        newestItem?: {
            key: string;
            age: number;
        };
    }>;
    /**
     * 批量设置缓存项（优化版本）
     *
     * @param items - 要设置的键值对数组
     * @returns 设置结果数组
     */
    batchSet(items: Array<{
        key: string;
        value: string;
        ttl?: number;
    }>): Promise<boolean[]>;
    /**
     * 批量获取缓存项（优化版本）
     *
     * @param keys - 要获取的键数组
     * @returns 值数组（未找到的为 null）
     */
    batchGet(keys: string[]): Promise<Array<string | null>>;
    /**
     * 批量删除缓存项（优化版本）
     *
     * @param keys - 要删除的键数组
     * @returns 删除结果数组
     */
    batchRemove(keys: string[]): Promise<boolean[]>;
    /**
     * 批量检查键是否存在（优化版本）
     *
     * @param keys - 要检查的键数组
     * @returns 存在性检查结果数组
     */
    batchHas(keys: string[]): Promise<boolean[]>;
    /**
     * 销毁引擎
     */
    destroy(): Promise<void>;
}
export {};
