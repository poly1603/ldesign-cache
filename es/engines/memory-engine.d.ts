import type { StorageEngineConfig } from '../types';
import { BaseStorageEngine } from './base-engine';
interface MemoryCacheItem {
    value: string;
    createdAt: number;
    expiresAt?: number;
}
export declare class MemoryEngine extends BaseStorageEngine {
    readonly name: "memory";
    readonly available = true;
    readonly maxSize: number;
    private readonly maxItems;
    private evictionStrategy;
    private storage;
    private cleanupTimer?;
    private evictionCount;
    private sizeCache;
    private readonly SIZE_CACHE_LIMIT;
    constructor(config?: StorageEngineConfig['memory']);
    private startCleanupTimer;
    setItem(key: string, value: string, ttl?: number): Promise<void>;
    getItem(key: string): Promise<string | null>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: {
        ttl?: number;
    }): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    hasItem(key: string): Promise<boolean>;
    length(): Promise<number>;
    cleanup(): Promise<void>;
    private calculateSizeFast;
    private evictByStrategy;
    private evictUntilSpaceAvailable;
    private evictOldestItems;
    protected updateUsedSize(): Promise<void>;
    getItemInfo(key: string): Promise<MemoryCacheItem | null>;
    getAllItems(): Promise<Record<string, MemoryCacheItem>>;
    setEvictionStrategy(strategyName: string): void;
    getEvictionStats(): {
        totalEvictions: number;
        strategy: string;
        strategyStats: Record<string, any>;
    };
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
    batchSet(items: Array<{
        key: string;
        value: string;
        ttl?: number;
    }>): Promise<boolean[]>;
    batchGet(keys: string[]): Promise<Array<string | null>>;
    batchRemove(keys: string[]): Promise<boolean[]>;
    batchHas(keys: string[]): Promise<boolean[]>;
    destroy(): Promise<void>;
}
export {};
//# sourceMappingURL=memory-engine.d.ts.map