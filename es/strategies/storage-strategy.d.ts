import type { SetOptions, StorageStrategyConfig, StorageStrategyResult } from '../types';
export declare class StorageStrategy {
    private config;
    private readonly strategyCache;
    private readonly maxCacheSize;
    private cacheHits;
    private cacheMisses;
    private readonly engineWeights;
    constructor(config?: Partial<StorageStrategyConfig>);
    private precomputeEngineWeights;
    private generateCacheKey;
    selectEngine(key: string, value: any, options?: SetOptions): Promise<StorageStrategyResult>;
    private fastCalculateDataSize;
    private estimateObjectSize;
    private tryQuickPath;
    private cacheResult;
    getCacheStats(): {
        hits: number;
        misses: number;
        hitRate: number;
        cacheSize: number;
    };
    private selectBySize;
    private selectByTTL;
    private selectByDataType;
    private calculateFullStrategy;
    private calculateEngineScores;
    private applySpecialRules;
    private getBestEngine;
    private generateReason;
    private getDataType;
    private calculateDataSize;
    updateConfig(config: Partial<StorageStrategyConfig>): void;
    getConfig(): StorageStrategyConfig;
}
//# sourceMappingURL=storage-strategy.d.ts.map