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
export class ObjectPool {
    /**
     * 创建对象池
     *
     * @param factory - 对象工厂函数
     * @param maxSize - 池的最大大小
     * @param reset - 可选的重置函数，在对象被复用前调用
     */
    constructor(factory, maxSize = 100, reset) {
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "maxSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "factory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "acquiredCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "releasedCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.factory = factory;
        this.maxSize = maxSize;
        this.reset = reset;
    }
    /**
     * 从池中获取对象
     * 如果池为空，创建新对象
     */
    acquire() {
        this.acquiredCount++;
        if (this.pool.length > 0) {
            const obj = this.pool.pop();
            if (this.reset) {
                this.reset(obj);
            }
            return obj;
        }
        return this.factory();
    }
    /**
     * 释放对象回池中
     * 如果池已满，对象将被丢弃
     */
    release(obj) {
        this.releasedCount++;
        if (this.pool.length < this.maxSize) {
            this.pool.push(obj);
        }
    }
    /**
     * 清空池
     */
    clear() {
        this.pool = [];
    }
    /**
     * 获取池的统计信息
     */
    getStats() {
        return {
            poolSize: this.pool.length,
            maxSize: this.maxSize,
            acquiredCount: this.acquiredCount,
            releasedCount: this.releasedCount,
            reuseRate: this.acquiredCount > 0
                ? `${((this.acquiredCount - (this.acquiredCount - this.releasedCount)) / this.acquiredCount * 100).toFixed(2)}%`
                : '0%',
        };
    }
}
/**
 * 缓存元数据对象池
 */
export const metadataPool = new ObjectPool(() => ({
    createdAt: 0,
    updatedAt: 0,
    expiresAt: undefined,
    version: 1,
    tags: [],
}), 500, (obj) => {
    obj.createdAt = 0;
    obj.updatedAt = 0;
    obj.expiresAt = undefined;
    obj.version = 1;
    obj.tags = [];
});
/**
 * 缓存项对象池
 */
export const cacheItemPool = new ObjectPool(() => ({
    value: null,
    metadata: null,
}), 500, (obj) => {
    obj.value = null;
    obj.metadata = null;
});
//# sourceMappingURL=object-pool.js.map