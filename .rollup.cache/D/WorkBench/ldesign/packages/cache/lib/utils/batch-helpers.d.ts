import type { CacheManager } from '../core/cache-manager';
import type { SerializableValue, SetOptions } from '../types';
/**
 * 批量操作结果接口
 */
export interface BatchOperationResult {
    /** 成功数量 */
    success: number;
    /** 失败数量 */
    failed: number;
    /** 失败的键 */
    failedKeys?: string[];
    /** 错误详情 */
    errors?: Array<{
        key: string;
        error: Error;
    }>;
}
/**
 * 批量获取操作选项
 */
export interface BatchGetOptions {
    /** 是否在部分失败时继续 */
    continueOnError?: boolean;
    /** 并发数限制 */
    concurrency?: number;
}
/**
 * 批量设置项接口
 */
export interface BatchSetItem<T = SerializableValue> {
    key: string;
    value: T;
    options?: SetOptions;
}
/**
 * 批量获取缓存数据
 *
 * 高效地从缓存中获取多个键的值，支持并发控制和错误处理
 *
 * @param cache - 缓存管理器实例
 * @param keys - 要获取的键数组
 * @param options - 批量获取选项
 * @returns 键值对 Map
 *
 * @example
 * ```typescript
 * const cache = createCache()
 * const results = await batchGet(cache, ['key1', 'key2', 'key3'])
 *
 * for (const [key, value] of results) {
 *   if (value !== null) {
 *
 *   }
 * }
 * ```
 */
export declare function batchGet<T extends SerializableValue = SerializableValue>(cache: CacheManager, keys: string[], options?: BatchGetOptions): Promise<Map<string, T | null>>;
/**
 * 批量设置缓存数据
 *
 * 高效地设置多个键值对到缓存中，支持并发控制和详细的错误报告
 *
 * @param cache - 缓存管理器实例
 * @param items - 要设置的项数组
 * @param options - 批量操作选项
 * @returns 操作结果统计
 *
 * @example
 * ```typescript
 * const cache = createCache()
 * const result = await batchSet(cache, [
 *   { key: 'user:1', value: { name: 'Alice' } },
 *   { key: 'user:2', value: { name: 'Bob' }, options: { ttl: 3600000 } },
 *   { key: 'user:3', value: { name: 'Charlie' } },
 * ])
 *
 *
 * ```
 */
export declare function batchSet<T extends SerializableValue = SerializableValue>(cache: CacheManager, items: Array<BatchSetItem<T>>, options?: {
    concurrency?: number;
    collectErrors?: boolean;
}): Promise<BatchOperationResult>;
/**
 * 批量删除缓存数据
 *
 * 删除多个缓存键，支持并发控制
 *
 * @param cache - 缓存管理器实例
 * @param keys - 要删除的键数组
 * @param options - 批量操作选项
 * @returns 操作结果统计
 *
 * @example
 * ```typescript
 * const cache = createCache()
 * const result = await batchRemove(cache, ['old:key1', 'old:key2', 'old:key3'])
 *
 * ```
 */
export declare function batchRemove(cache: CacheManager, keys: string[], options?: {
    concurrency?: number;
}): Promise<BatchOperationResult>;
/**
 * 批量检查键是否存在
 *
 * 检查多个键是否存在于缓存中
 *
 * @param cache - 缓存管理器实例
 * @param keys - 要检查的键数组
 * @param options - 批量操作选项
 * @returns 键存在状态的 Map
 *
 * @example
 * ```typescript
 * const cache = createCache()
 * const exists = await batchHas(cache, ['key1', 'key2', 'key3'])
 *
 * for (const [key, exists] of exists) {
 *
 * }
 * ```
 */
export declare function batchHas(cache: CacheManager, keys: string[], options?: {
    concurrency?: number;
}): Promise<Map<string, boolean>>;
/**
 * 批量操作助手类
 *
 * 提供链式调用的批量操作接口
 */
export declare class BatchHelper {
    private cache;
    constructor(cache: CacheManager);
    /**
     * 批量获取
     */
    get<T extends SerializableValue = SerializableValue>(keys: string[], options?: BatchGetOptions): Promise<Map<string, T | null>>;
    /**
     * 批量设置
     */
    set<T extends SerializableValue = SerializableValue>(items: Array<BatchSetItem<T>>, options?: {
        concurrency?: number;
        collectErrors?: boolean;
    }): Promise<BatchOperationResult>;
    /**
     * 批量删除
     */
    remove(keys: string[], options?: {
        concurrency?: number;
    }): Promise<BatchOperationResult>;
    /**
     * 批量检查
     */
    has(keys: string[], options?: {
        concurrency?: number;
    }): Promise<Map<string, boolean>>;
}
/**
 * 创建批量操作助手
 *
 * @param cache - 缓存管理器实例
 * @returns 批量操作助手实例
 *
 * @example
 * ```typescript
 * const cache = createCache()
 * const batch = createBatchHelper(cache)
 *
 * const results = await batch.get(['key1', 'key2', 'key3'])
 * await batch.set([
 *   { key: 'newKey1', value: 'value1' },
 *   { key: 'newKey2', value: 'value2' },
 * ])
 * ```
 */
export declare function createBatchHelper(cache: CacheManager): BatchHelper;
