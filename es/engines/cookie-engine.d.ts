import type { StorageEngineConfig } from '../types';
import { BaseStorageEngine } from './base-engine';
export declare class CookieEngine extends BaseStorageEngine {
    readonly name: "cookie";
    readonly maxSize: number;
    private domain?;
    private path;
    private secure;
    private sameSite;
    private httpOnly;
    constructor(config?: StorageEngineConfig['cookie']);
    get available(): boolean;
    setItem(key: string, value: string, ttl?: number): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    length(): Promise<number>;
    cleanup(): Promise<void>;
    getRemainingSpace(): number;
    getUsageRatio(): number;
}
//# sourceMappingURL=cookie-engine.d.ts.map