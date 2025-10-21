import type { SerializableValue, SetOptions } from '../types';
export interface PrefetchConfig {
    strategy?: 'markov' | 'lru' | 'association';
    cacheGetter?: (key: string) => Promise<SerializableValue | null>;
    cacheSetter?: (key: string, value: SerializableValue, opts?: SetOptions) => Promise<void>;
    fetcher?: (key: string) => Promise<SerializableValue>;
}
export interface PrefetchStrategy {
    name: string;
    predict: (currentKey: string, history: string[]) => string[];
    updateHistory: (key: string) => void;
    clear: () => void;
}
export interface WarmupConfig {
    keys?: string[];
    patterns?: string[];
    fetcher?: (key: string) => Promise<SerializableValue>;
    batchFetcher?: (keys: string[]) => Promise<Map<string, SerializableValue>>;
    concurrency?: number;
    retryCount?: number;
    priority?: 'high' | 'medium' | 'low';
}
export declare class PrefetchManager {
    private strategies;
    private activeStrategy;
    private prefetchQueue;
    private prefetchInProgress;
    private cacheGetter?;
    private cacheSetter?;
    private fetcher?;
    constructor(config?: {
        strategy?: 'markov' | 'lru' | 'association';
        cacheGetter?: (key: string) => Promise<SerializableValue | null>;
        cacheSetter?: (key: string, value: SerializableValue, options?: SetOptions) => Promise<void>;
        fetcher?: (key: string) => Promise<SerializableValue>;
    });
    recordAccess(key: string): Promise<void>;
    private prefetch;
    private fetchAndCache;
    warmup(config: WarmupConfig): Promise<{
        success: string[];
        failed: Array<{
            key: string;
            error: Error;
        }>;
    }>;
    private retryFetch;
    private runConcurrent;
    setStrategy(strategyName: 'markov' | 'lru' | 'association'): void;
    addStrategy(name: string, strategy: PrefetchStrategy): void;
    getStats(): {
        queueSize: number;
        inProgressCount: number;
        strategy: string;
    };
    clear(): void;
}
export declare function createPrefetchManager(config?: PrefetchConfig): PrefetchManager;
//# sourceMappingURL=prefetch-manager.d.ts.map