import type { SerializableValue, StorageEngine } from '../types';
import type { CacheManager } from './cache-manager';
export interface CacheSnapshot {
    version: string;
    timestamp: number;
    data: Record<string, SerializableValue>;
    metadata?: {
        name?: string;
        description?: string;
        custom?: Record<string, any>;
    };
}
export interface SnapshotOptions {
    name?: string;
    description?: string;
    keys?: string[];
    excludeKeys?: string[];
    engine?: StorageEngine;
    compress?: boolean;
    metadata?: Record<string, any>;
}
export interface RestoreOptions {
    clear?: boolean;
    merge?: boolean;
    keys?: string[];
    excludeKeys?: string[];
    engine?: StorageEngine;
}
export declare class SnapshotManager {
    private cache;
    private static readonly SNAPSHOT_VERSION;
    constructor(cache: CacheManager);
    create(options?: SnapshotOptions): Promise<CacheSnapshot>;
    restore(snapshot: CacheSnapshot, options?: RestoreOptions): Promise<void>;
    export(snapshot: CacheSnapshot, pretty?: boolean): string;
    import(json: string): CacheSnapshot;
    exportAsBlob(snapshot: CacheSnapshot, pretty?: boolean): Blob;
    importFromBlob(blob: Blob): Promise<CacheSnapshot>;
    compare(snapshot1: CacheSnapshot, snapshot2: CacheSnapshot): {
        added: string[];
        removed: string[];
        modified: string[];
        unchanged: string[];
    };
    merge(...snapshots: CacheSnapshot[]): CacheSnapshot;
    getStats(snapshot: CacheSnapshot): {
        keyCount: number;
        dataSize: number;
        timestamp: number;
        age: number;
    };
}
export declare function createSnapshotManager(cache: CacheManager): SnapshotManager;
//# sourceMappingURL=snapshot-manager.d.ts.map