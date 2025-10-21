export interface EvictionStrategy {
    name: string;
    recordAccess: (key: string) => void;
    recordAdd: (key: string, ttl?: number) => void;
    getEvictionKey: () => string | null;
    removeKey: (key: string) => void;
    clear: () => void;
    getStats: () => Record<string, any>;
}
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
    private moveToHead;
    private addToHead;
    private removeNode;
}
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
export declare class EvictionStrategyFactory {
    private static strategies;
    static create(name: string): EvictionStrategy;
    static register(name: string, factory: () => EvictionStrategy): void;
    static getAvailableStrategies(): string[];
}
//# sourceMappingURL=eviction-strategies.d.ts.map