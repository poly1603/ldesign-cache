export interface SerializationCacheConfig {
    maxSize?: number;
    ttl?: number;
    enableStats?: boolean;
}
export declare class SerializationCache<T = string> {
    private cache;
    private readonly maxSize;
    private readonly ttl;
    private readonly enableStats;
    private hits;
    private misses;
    private evictions;
    constructor(config?: SerializationCacheConfig);
    get(key: string): T | null;
    set(key: string, value: T): void;
    getOrSet(key: string, factory: () => T): T;
    delete(key: string): boolean;
    clear(): void;
    get size(): number;
    private evictLRU;
    getStats(): {
        size: number;
        maxSize: number;
        hits: number;
        misses: number;
        evictions: number;
        hitRate: number;
        averageAccessCount: number;
    };
    resetStats(): void;
    keys(): string[];
    has(key: string): boolean;
    cleanup(): number;
}
export declare function createSerializationCache<T = string>(config?: SerializationCacheConfig): SerializationCache<T>;
export declare const globalSerializeCache: SerializationCache<string>;
export declare const globalDeserializeCache: SerializationCache<unknown>;
export declare function serializeWithCache(value: unknown, key?: string): string;
export declare function deserializeWithCache<T = unknown>(serialized: string, key?: string): T;
//# sourceMappingURL=serialization-cache.d.ts.map