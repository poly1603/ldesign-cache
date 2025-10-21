import type { StorageEngineConfig } from '../types';
import { BaseStorageEngine } from './base-engine';
export declare class LocalStorageEngine extends BaseStorageEngine {
    readonly name: "localStorage";
    readonly maxSize: number;
    private keyPrefix;
    constructor(config?: StorageEngineConfig['localStorage']);
    get available(): boolean;
    private getFullKey;
    private extractKey;
    setItem(key: string, value: string, ttl?: number): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    length(): Promise<number>;
    getRemainingSpace(): number;
    getUsageRatio(): number;
}
//# sourceMappingURL=local-storage-engine.d.ts.map