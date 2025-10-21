export type PrefetchStrategy = 'eager' | 'lazy' | 'predictive' | 'manual';
export interface PrefetchRule {
    id: string;
    trigger: (context: PrefetchContext) => boolean;
    keys: string[] | ((context: PrefetchContext) => string[]);
    fetcher: (key: string) => Promise<any>;
    priority?: number;
    strategy?: PrefetchStrategy;
    delay?: number;
}
export interface PrefetchContext {
    currentKey?: string;
    recentKeys: string[];
    timestamp: number;
    userData?: any;
}
export interface PrefetcherOptions {
    maxConcurrent?: number;
    timeout?: number;
    enablePredictive?: boolean;
    predictionWindow?: number;
    minConfidence?: number;
    prefetchOnIdle?: boolean;
    idleThreshold?: number;
}
export declare class Prefetcher {
    private readonly options;
    private readonly rules;
    private readonly accessHistory;
    private readonly patterns;
    private readonly tasks;
    private readonly cache;
    private runningTasks;
    private idleTimer?;
    private lastAccessTime;
    constructor(cache: Map<string, any>, options?: PrefetcherOptions);
    addRule(rule: PrefetchRule): void;
    removeRule(id: string): void;
    recordAccess(key: string): void;
    private getRecentKeys;
    private updatePatterns;
    private cleanupPatterns;
    private predictivePrefetch;
    private predictNextKeys;
    private checkPrefetchRules;
    private createTask;
    private executeTasks;
    private runTask;
    private setupIdleDetection;
    private onIdle;
    private warmupFrequentKeys;
    prefetch(keys: string[], fetcher: (key: string) => Promise<any>, options?: {
        priority?: number;
        strategy?: PrefetchStrategy;
    }): Promise<void>;
    getStats(): {
        totalTasks: number;
        pendingTasks: number;
        runningTasks: number;
        completedTasks: number;
        failedTasks: number;
        patterns: number;
        predictions: Array<{
            key: string;
            confidence: number;
        }>;
    };
    dispose(): void;
}
export declare function withPrefetching<T extends {
    get: any;
    set: any;
    has: any;
}>(cache: T, options?: PrefetcherOptions): T & {
    prefetcher: Prefetcher;
};
//# sourceMappingURL=prefetcher.d.ts.map