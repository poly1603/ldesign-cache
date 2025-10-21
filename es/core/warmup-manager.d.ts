import type { SetOptions } from '../types';
import type { CacheManager } from './cache-manager';
export interface WarmupItem<T = any> {
    key: string;
    fetcher: () => Promise<T> | T;
    options?: SetOptions;
    priority?: number;
    dependencies?: string[];
}
export interface WarmupConfig {
    concurrency?: number;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    continueOnError?: boolean;
}
export interface WarmupResult {
    successful: string[];
    failed: Array<{
        key: string;
        error: Error;
        retries: number;
    }>;
    duration: number;
    stats: {
        total: number;
        success: number;
        failed: number;
        skipped: number;
    };
}
export declare class WarmupManager {
    private cache;
    private config;
    private warmupItems;
    private running;
    constructor(cache: CacheManager, config?: WarmupConfig);
    register<T = any>(item: WarmupItem<T> | WarmupItem<T>[]): void;
    unregister(key: string | string[]): void;
    warmup(keys?: string[]): Promise<WarmupResult>;
    private getItemsToWarmup;
    private sortByPriority;
    private resolveDependencies;
    private processBatches;
    private processItem;
    private fetchWithTimeout;
    private delay;
    getStatus(): {
        running: boolean;
        itemCount: number;
        items: Array<{
            key: string;
            priority?: number;
        }>;
    };
    clear(): void;
}
export declare function createWarmupManager(cache: CacheManager, config?: WarmupConfig): WarmupManager;
//# sourceMappingURL=warmup-manager.d.ts.map