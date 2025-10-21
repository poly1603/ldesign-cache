/**
 * 对象池 - 用于复用频繁创建的对象，减少GC压力
 *
 * 适用场景：
 * - 频繁创建和销毁的对象
 * - 对象创建成本较高
 * - 对象可以被重置和复用
 *
 * @example
 * ```typescript
 * const pool = new ObjectPool(() => ({ data: null }), 100)
 * const obj = pool.acquire()
 * obj.data = 'some data'
 * // 使用完毕后释放
 * pool.release(obj)
 * ```
 */
export declare class ObjectPool<T> {
    private pool;
    private readonly maxSize;
    private readonly factory;
    private readonly reset?;
    private acquiredCount;
    private releasedCount;
    /**
     * 创建对象池
     *
     * @param factory - 对象工厂函数
     * @param maxSize - 池的最大大小
     * @param reset - 可选的重置函数，在对象被复用前调用
     */
    constructor(factory: () => T, maxSize?: number, reset?: (obj: T) => void);
    /**
     * 从池中获取对象
     * 如果池为空，创建新对象
     */
    acquire(): T;
    /**
     * 释放对象回池中
     * 如果池已满，对象将被丢弃
     */
    release(obj: T): void;
    /**
     * 清空池
     */
    clear(): void;
    /**
     * 获取池的统计信息
     */
    getStats(): {
        poolSize: number;
        maxSize: number;
        acquiredCount: number;
        releasedCount: number;
        reuseRate: string;
    };
}
/**
 * 缓存元数据对象池
 */
export declare const metadataPool: ObjectPool<{
    createdAt: number;
    updatedAt: number;
    expiresAt: number | undefined;
    version: number;
    tags: string[];
}>;
/**
 * 缓存项对象池
 */
export declare const cacheItemPool: ObjectPool<{
    value: any;
    metadata: any;
}>;
