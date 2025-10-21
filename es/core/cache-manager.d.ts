import type { CacheEventListener, CacheEventType, CacheMetadata, CacheOptions, CacheStats, ICacheManager, SerializableValue, SetOptions, StorageEngine } from '../types';
export declare class CacheManager implements ICacheManager {
    private options;
    private engines;
    private strategy;
    private security;
    private eventEmitter;
    private stats;
    private cleanupTimer?;
    private initialized;
    private initPromise;
    private memoryManager;
    private prefetchManager?;
    private serializationCache;
    private stringSerializationCache;
    private readonly maxStringCacheSize;
    private serializationCacheOrder;
    private serializationCacheCounter;
    private eventThrottleRing;
    private eventThrottleIndex;
    private readonly eventThrottleMs;
    private readonly maxEventThrottleSize;
    constructor(options?: CacheOptions);
    private ensureInitialized;
    private initializeEngines;
    private startCleanupTimer;
    private selectEngine;
    private processKey;
    private unprocessKey;
    private serializeValue;
    private createSerializationCacheKey;
    private cacheSerializationResult;
    private deserializeValue;
    private removeCircularReferences;
    private validateSetInput;
    private createMetadata;
    private getDataType;
    private emitEvent;
    private emitStrategyEvent;
    set<T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>;
    get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null>;
    remember<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions & {
        refresh?: boolean;
    }): Promise<T>;
    getOrSet<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T> | T, options?: SetOptions): Promise<T>;
    mset<T extends SerializableValue = SerializableValue>(items: Array<{
        key: string;
        value: T;
        options?: SetOptions;
    }> | Record<string, T>, options?: SetOptions): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    mget<T extends SerializableValue = SerializableValue>(keys: string[]): Promise<Record<string, T | null>>;
    mremove(keys: string[] | string): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    mhas(keys: string[]): Promise<Record<string, boolean>>;
    remove(key: string): Promise<void>;
    clear(engine?: StorageEngine): Promise<void>;
    has(key: string): Promise<boolean>;
    keys(engine?: StorageEngine): Promise<string[]>;
    getMetadata(key: string): Promise<CacheMetadata | null>;
    getStats(): Promise<CacheStats>;
    cleanup(): Promise<void>;
    on<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void;
    off<T = any>(event: CacheEventType, listener: CacheEventListener<T>): void;
    destroy(): Promise<void>;
    optimizeMemory(): Promise<void>;
    private performEmergencyCleanup;
}
//# sourceMappingURL=cache-manager.d.ts.map