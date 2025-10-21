import type { CacheManager } from '../core/cache-manager';
import type { SerializableValue, SetOptions } from '../types';
export interface BatchOperationResult {
    success: number;
    failed: number;
    failedKeys?: string[];
    errors?: Array<{
        key: string;
        error: Error;
    }>;
}
export interface BatchGetOptions {
    continueOnError?: boolean;
    concurrency?: number;
}
export interface BatchSetItem<T = SerializableValue> {
    key: string;
    value: T;
    options?: SetOptions;
}
export declare function batchGet<T extends SerializableValue = SerializableValue>(cache: CacheManager, keys: string[], options?: BatchGetOptions): Promise<Map<string, T | null>>;
export declare function batchSet<T extends SerializableValue = SerializableValue>(cache: CacheManager, items: Array<BatchSetItem<T>>, options?: {
    concurrency?: number;
    collectErrors?: boolean;
}): Promise<BatchOperationResult>;
export declare function batchRemove(cache: CacheManager, keys: string[], options?: {
    concurrency?: number;
}): Promise<BatchOperationResult>;
export declare function batchHas(cache: CacheManager, keys: string[], options?: {
    concurrency?: number;
}): Promise<Map<string, boolean>>;
export declare class BatchHelper {
    private cache;
    constructor(cache: CacheManager);
    get<T extends SerializableValue = SerializableValue>(keys: string[], options?: BatchGetOptions): Promise<Map<string, T | null>>;
    set<T extends SerializableValue = SerializableValue>(items: Array<BatchSetItem<T>>, options?: {
        concurrency?: number;
        collectErrors?: boolean;
    }): Promise<BatchOperationResult>;
    remove(keys: string[], options?: {
        concurrency?: number;
    }): Promise<BatchOperationResult>;
    has(keys: string[], options?: {
        concurrency?: number;
    }): Promise<Map<string, boolean>>;
}
export declare function createBatchHelper(cache: CacheManager): BatchHelper;
//# sourceMappingURL=batch-helpers.d.ts.map