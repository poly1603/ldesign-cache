import type { SerializableValue, StorageEngine } from '../types';
export interface MemoryStats {
    totalUsed: number;
    limit: number;
    usagePercentage: number;
    engineUsage: Map<StorageEngine, number>;
    itemCount: number;
    pressureLevel: 'low' | 'medium' | 'high' | 'critical';
    lastCleanupTime: number;
    cleanupCount: number;
}
export interface MemoryManagerConfig {
    maxMemory?: number;
    highPressureThreshold?: number;
    criticalPressureThreshold?: number;
    autoCleanupInterval?: number;
    enableAutoPressureResponse?: boolean;
}
export declare class MemoryManager {
    private config;
    private currentUsage;
    private engineUsage;
    private itemCount;
    private cleanupCount;
    private lastCleanupTime;
    private cleanupTimer?;
    private metadataPool;
    private cacheItemPool;
    private objectSizeCache;
    private pressureCallbacks;
    constructor(config?: MemoryManagerConfig);
    updateUsage(delta: number, engine?: StorageEngine): void;
    updateItemCount(delta: number): void;
    getStats(): MemoryStats;
    private getPressureLevel;
    private checkMemoryPressure;
    private performCleanup;
    private emergencyCleanup;
    private startAutoCleanup;
    calculateObjectSize(obj: SerializableValue): number;
    private calculateStringSize;
    onPressure(callback: (level: MemoryStats['pressureLevel']) => void): () => void;
    acquireMetadata(): any;
    releaseMetadata(obj: any): void;
    acquireCacheItem(): any;
    releaseCacheItem(obj: any): void;
    hasEnoughMemory(required: number): boolean;
    requestMemory(size: number): boolean;
    reset(): void;
    destroy(): void;
}
export declare function createMemoryManager(config?: MemoryManagerConfig): MemoryManager;
//# sourceMappingURL=memory-manager.d.ts.map