import type { IStorageEngine, StorageEngine } from '../types';
export declare abstract class BaseStorageEngine implements IStorageEngine {
    abstract readonly name: StorageEngine;
    abstract readonly available: boolean;
    abstract readonly maxSize: number;
    protected _usedSize: number;
    get usedSize(): number;
    abstract setItem(key: string, value: string, ttl?: number): Promise<void>;
    abstract getItem(key: string): Promise<string | null>;
    abstract removeItem(key: string): Promise<void>;
    abstract clear(): Promise<void>;
    abstract keys(): Promise<string[]>;
    hasItem(key: string): Promise<boolean>;
    abstract length(): Promise<number>;
    cleanup(): Promise<void>;
    protected calculateSize(data: string): number;
    protected updateUsedSize(): Promise<void>;
    protected checkStorageSpace(dataSize: number): boolean;
    protected createTTLData(value: string, ttl?: number): string;
    protected parseTTLData(data: string): {
        value: string;
        expired: boolean;
    };
}
//# sourceMappingURL=base-engine.d.ts.map