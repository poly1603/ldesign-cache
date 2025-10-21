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
export async function batchGet(cache, keys, options = {}) {
    const { continueOnError = true, concurrency = 10 } = options;
    const results = new Map();
    // 分批处理以限制并发
    for (let i = 0; i < keys.length; i += concurrency) {
        const batch = keys.slice(i, i + concurrency);
        const promises = batch.map(async (key) => {
            try {
                const value = await cache.get(key);
                return { key, value, error: null };
            }
            catch (error) {
                if (!continueOnError) {
                    throw error;
                }
                return { key, value: null, error: error };
            }
        });
        const settled = await Promise.allSettled(promises);
        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.set(result.value.key, result.value.value);
            }
            else if (continueOnError) {
                // 记录失败但继续
                console.warn(`Failed to get key: ${result.reason}`);
            }
        }
    }
    return results;
}
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
export async function batchSet(cache, items, options = {}) {
    const { concurrency = 10, collectErrors = false } = options;
    let success = 0;
    let failed = 0;
    const failedKeys = [];
    const errors = [];
    // 分批处理以限制并发
    for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, i + concurrency);
        const promises = batch.map(async ({ key, value, options: itemOptions }) => {
            try {
                await cache.set(key, value, itemOptions);
                return { success: true, key };
            }
            catch (error) {
                return { success: false, key, error: error };
            }
        });
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === 'fulfilled') {
                if (result.value.success) {
                    success++;
                }
                else {
                    failed++;
                    failedKeys.push(result.value.key);
                    if (collectErrors && result.value.error) {
                        errors.push({ key: result.value.key, error: result.value.error });
                    }
                }
            }
            else {
                failed++;
            }
        }
    }
    return {
        success,
        failed,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
        errors: errors.length > 0 ? errors : undefined,
    };
}
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
export async function batchRemove(cache, keys, options = {}) {
    const { concurrency = 10 } = options;
    let success = 0;
    let failed = 0;
    const failedKeys = [];
    // 分批处理以限制并发
    for (let i = 0; i < keys.length; i += concurrency) {
        const batch = keys.slice(i, i + concurrency);
        const promises = batch.map(async (key) => {
            try {
                await cache.remove(key);
                return { success: true, key };
            }
            catch {
                return { success: false, key };
            }
        });
        const results = await Promise.allSettled(promises);
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.success) {
                success++;
            }
            else {
                failed++;
                if (result.status === 'fulfilled') {
                    failedKeys.push(result.value.key);
                }
            }
        }
    }
    return {
        success,
        failed,
        failedKeys: failedKeys.length > 0 ? failedKeys : undefined,
    };
}
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
export async function batchHas(cache, keys, options = {}) {
    const { concurrency = 10 } = options;
    const results = new Map();
    // 分批处理以限制并发
    for (let i = 0; i < keys.length; i += concurrency) {
        const batch = keys.slice(i, i + concurrency);
        const promises = batch.map(async (key) => {
            try {
                const exists = await cache.has(key);
                return { key, exists };
            }
            catch {
                return { key, exists: false };
            }
        });
        const settled = await Promise.allSettled(promises);
        for (const result of settled) {
            if (result.status === 'fulfilled') {
                results.set(result.value.key, result.value.exists);
            }
            else {
                results.set('', false); // 出错时标记为不存在
            }
        }
    }
    return results;
}
/**
 * 批量操作助手类
 *
 * 提供链式调用的批量操作接口
 */
export class BatchHelper {
    constructor(cache) {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cache
        });
    }
    /**
     * 批量获取
     */
    async get(keys, options) {
        return batchGet(this.cache, keys, options);
    }
    /**
     * 批量设置
     */
    async set(items, options) {
        return batchSet(this.cache, items, options);
    }
    /**
     * 批量删除
     */
    async remove(keys, options) {
        return batchRemove(this.cache, keys, options);
    }
    /**
     * 批量检查
     */
    async has(keys, options) {
        return batchHas(this.cache, keys, options);
    }
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
export function createBatchHelper(cache) {
    return new BatchHelper(cache);
}
//# sourceMappingURL=batch-helpers.js.map