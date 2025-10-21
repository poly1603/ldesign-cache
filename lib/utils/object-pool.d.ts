export declare class ObjectPool<T> {
    private pool;
    private readonly maxSize;
    private readonly factory;
    private readonly reset?;
    private acquiredCount;
    private releasedCount;
    constructor(factory: () => T, maxSize?: number, reset?: (obj: T) => void);
    acquire(): T;
    release(obj: T): void;
    clear(): void;
    getStats(): {
        poolSize: number;
        maxSize: number;
        acquiredCount: number;
        releasedCount: number;
        reuseRate: string;
    };
}
export declare const metadataPool: ObjectPool<{
    createdAt: number;
    updatedAt: number;
    expiresAt: number | undefined;
    version: number;
    tags: string[];
}>;
export declare const cacheItemPool: ObjectPool<{
    value: any;
    metadata: any;
}>;
//# sourceMappingURL=object-pool.d.ts.map