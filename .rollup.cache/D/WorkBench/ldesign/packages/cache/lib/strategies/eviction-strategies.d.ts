/**
 * 淘汰策略接口
 */
export interface EvictionStrategy {
    /** 策略名称 */
    name: string;
    /** 添加访问记录 */
    recordAccess: (key: string) => void;
    /** 添加新项（某些策略可利用TTL信息） */
    recordAdd: (key: string, ttl?: number) => void;
    /** 获取应该淘汰的键 */
    getEvictionKey: () => string | null;
    /** 移除键的记录 */
    removeKey: (key: string) => void;
    /** 清空所有记录 */
    clear: () => void;
    /** 获取统计信息 */
    getStats: () => Record<string, any>;
}
/**
 * LRU (Least Recently Used) 淘汰策略
 *
 * 优化版本：使用双向链表+哈希表实现O(1)复杂度
 * - recordAccess: O(1)
 * - recordAdd: O(1)
 * - getEvictionKey: O(1)
 * - removeKey: O(1)
 *
 * 性能提升：从O(n)优化到O(1)，在大量缓存项时性能提升显著
 */
export declare class LRUStrategy implements EvictionStrategy {
    readonly name = "LRU";
    private nodeMap;
    private head;
    private tail;
    recordAccess(key: string): void;
    recordAdd(key: string): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
    /**
     * 将节点移到头部
     */
    private moveToHead;
    /**
     * 添加节点到头部
     */
    private addToHead;
    /**
     * 从链表中移除节点
     */
    private removeNode;
}
/**
 * LFU (Least Frequently Used) 淘汰策略
 *
 * 淘汰使用频率最低的缓存项
 */
export declare class LFUStrategy implements EvictionStrategy {
    readonly name = "LFU";
    private frequencyMap;
    private lastAccessTime;
    recordAccess(key: string): void;
    recordAdd(key: string): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * FIFO (First In First Out) 淘汰策略
 *
 * 淘汰最早添加的缓存项
 */
export declare class FIFOStrategy implements EvictionStrategy {
    readonly name = "FIFO";
    private queue;
    recordAccess(_key: string): void;
    recordAdd(key: string): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * MRU (Most Recently Used) 淘汰策略
 *
 * 淘汰最近使用的缓存项（适用于某些特殊场景）
 */
export declare class MRUStrategy implements EvictionStrategy {
    readonly name = "MRU";
    private accessOrder;
    private counter;
    recordAccess(key: string): void;
    recordAdd(key: string): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * 随机淘汰策略
 *
 * 随机选择一个缓存项进行淘汰
 */
export declare class RandomStrategy implements EvictionStrategy {
    readonly name = "Random";
    private keys;
    recordAccess(_key: string): void;
    recordAdd(key: string): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * TTL 优先淘汰策略
 *
 * 优先淘汰即将过期的缓存项
 */
export declare class TTLStrategy implements EvictionStrategy {
    readonly name = "TTL";
    private ttlMap;
    recordAccess(_key: string): void;
    recordAdd(key: string, ttl?: number): void;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * 自适应替换缓存策略 (ARC)
 *
 * 结合 LRU 和 LFU 的优点，自动调整策略
 */
export declare class ARCStrategy implements EvictionStrategy {
    readonly name = "ARC";
    private lru;
    private lfu;
    private adaptiveWeight;
    private hitCount;
    private missCount;
    recordAccess(key: string): void;
    recordAdd(key: string): void;
    private updateWeight;
    getEvictionKey(): string | null;
    removeKey(key: string): void;
    clear(): void;
    getStats(): Record<string, any>;
}
/**
 * 策略工厂
 */
export declare class EvictionStrategyFactory {
    private static strategies;
    /**
     * 创建淘汰策略
     */
    static create(name: string): EvictionStrategy;
    /**
     * 注册自定义策略
     */
    static register(name: string, factory: () => EvictionStrategy): void;
    /**
     * 获取所有可用策略名称
     */
    static getAvailableStrategies(): string[];
}
