import type { StorageEngineConfig } from '../types';
import { BaseStorageEngine } from './base-engine';
export declare class IndexedDBEngine extends BaseStorageEngine {
    readonly name: "indexedDB";
    readonly maxSize: number;
    private db;
    private dbName;
    private version;
    private storeName;
    private constructor();
    static create(config?: StorageEngineConfig['indexedDB']): Promise<IndexedDBEngine>;
    get available(): boolean;
    private initialize;
    private getTransaction;
    private getStore;
    private executeRequest;
    setItem(key: string, value: string, ttl?: number): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    length(): Promise<number>;
    cleanup(): Promise<void>;
    getDatabaseSize(): Promise<number>;
    protected updateUsedSize(): Promise<void>;
}
//# sourceMappingURL=indexeddb-engine.d.ts.map