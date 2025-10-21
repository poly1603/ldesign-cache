export { CacheManager } from './core/cache-manager';
export type { CacheEvent, CacheOptions, SetOptions } from './types';
export declare const lazyModules: {
    loadPerformanceMonitor(): Promise<{
        PerformanceMonitor: typeof import("./core/performance-monitor").PerformanceMonitor;
    }>;
    loadSyncManager(): Promise<{
        SyncManager: typeof import("./core/sync-manager").SyncManager;
    }>;
    loadWarmupManager(): Promise<{
        WarmupManager: typeof import("./core/warmup-manager").WarmupManager;
        createWarmupManager: typeof import("./core/warmup-manager").createWarmupManager;
    }>;
    loadCacheAnalyzer(): Promise<{
        CacheAnalyzer: typeof import("./core/cache-analyzer").CacheAnalyzer;
        createCacheAnalyzer: typeof import("./core/cache-analyzer").createCacheAnalyzer;
    }>;
    loadNamespaceManager(): Promise<{
        CacheNamespace: typeof import("./core/namespace-manager").CacheNamespace;
        createNamespace: typeof import("./core/namespace-manager").createNamespace;
    }>;
    loadEngines(): Promise<{
        MemoryEngine: typeof import("./engines/memory-engine").MemoryEngine;
        LocalStorageEngine: typeof import("./engines/local-storage-engine").LocalStorageEngine;
        SessionStorageEngine: typeof import("./engines/session-storage-engine").SessionStorageEngine;
        IndexedDBEngine: typeof import("./engines/indexeddb-engine").IndexedDBEngine;
        CookieEngine: typeof import("./engines/cookie-engine").CookieEngine;
    }>;
    loadSecurity(): Promise<{
        SecurityManager: typeof import("./security/security-manager").SecurityManager;
        AESCrypto: typeof import("./security/aes-crypto").AESCrypto;
        KeyObfuscator: typeof import("./security/key-obfuscator").KeyObfuscator;
    }>;
    loadStrategies(): Promise<{
        LRUStrategy: typeof import("./strategies/eviction-strategies").LRUStrategy;
        LFUStrategy: typeof import("./strategies/eviction-strategies").LFUStrategy;
        FIFOStrategy: typeof import("./strategies/eviction-strategies").FIFOStrategy;
        MRUStrategy: typeof import("./strategies/eviction-strategies").MRUStrategy;
        RandomStrategy: typeof import("./strategies/eviction-strategies").RandomStrategy;
        TTLStrategy: typeof import("./strategies/eviction-strategies").TTLStrategy;
        ARCStrategy: typeof import("./strategies/eviction-strategies").ARCStrategy;
        EvictionStrategyFactory: typeof import("./strategies/eviction-strategies").EvictionStrategyFactory;
        StorageStrategy: typeof import("./strategies/storage-strategy").StorageStrategy;
    }>;
    loadUtils(): Promise<typeof import("./utils/index")>;
    loadVue(): Promise<{
        CacheProvider: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
            options: {
                type: import("vue").PropType<import("./types").CacheOptions>;
                default: () => {};
            };
        }>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
            [key: string]: any;
        }>[], {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
            options: {
                type: import("vue").PropType<import("./types").CacheOptions>;
                default: () => {};
            };
        }>> & Readonly<{}>, {
            options: import("./types").CacheOptions;
        }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
        useCacheList<T extends import("./types").SerializableValue = import("./types").SerializableValue>(key: string, defaultValue?: T[], options?: {
            ttl?: number;
            immediate?: boolean;
        }): {
            list: import("vue").ComputedRef<T[]>;
            loading: import("vue").ComputedRef<boolean>;
            error: import("vue").ComputedRef<Error>;
            exists: import("vue").ComputedRef<boolean>;
            add: (item: T) => Promise<void>;
            remove: (index: number) => Promise<void>;
            removeItem: (item: T) => Promise<void>;
            update: (index: number, item: T) => Promise<void>;
            insert: (index: number, item: T) => Promise<void>;
            clear: () => Promise<void>;
            refresh: () => Promise<void>;
            length: import("vue").ComputedRef<number>;
            isEmpty: import("vue").ComputedRef<boolean>;
            first: import("vue").ComputedRef<T>;
            last: import("vue").ComputedRef<T>;
        };
        useCacheObject<T extends Record<string, import("./types").SerializableValue> = Record<string, import("./types").SerializableValue>>(key: string, defaultValue?: T, options?: {
            ttl?: number;
            immediate?: boolean;
        }): {
            object: import("vue").ComputedRef<T>;
            loading: import("vue").ComputedRef<boolean>;
            error: import("vue").ComputedRef<Error>;
            exists: import("vue").ComputedRef<boolean>;
            setProperty: <K extends keyof T>(prop: K, value: T[K]) => Promise<void>;
            removeProperty: <K extends keyof T>(prop: K) => Promise<void>;
            merge: (updates: Partial<T>) => Promise<void>;
            clear: () => Promise<void>;
            refresh: () => Promise<void>;
            keys: import("vue").ComputedRef<string[]>;
            values: import("vue").ComputedRef<import("./types").SerializableValue[]>;
            entries: import("vue").ComputedRef<[string, import("./types").SerializableValue][]>;
            isEmpty: import("vue").ComputedRef<boolean>;
            size: import("vue").ComputedRef<number>;
        };
        useCacheCounter(key: string, defaultValue?: number, options?: {
            ttl?: number;
            immediate?: boolean;
            min?: number;
            max?: number;
        }): {
            count: import("vue").ComputedRef<number>;
            loading: import("vue").ComputedRef<boolean>;
            error: import("vue").ComputedRef<Error>;
            exists: import("vue").ComputedRef<boolean>;
            increment: (step?: number) => Promise<void>;
            decrement: (step?: number) => Promise<void>;
            reset: () => Promise<void>;
            set: (value: number) => Promise<void>;
            refresh: () => Promise<void>;
            isAtMin: import("vue").ComputedRef<boolean>;
            isAtMax: import("vue").ComputedRef<boolean>;
            isZero: import("vue").ComputedRef<boolean>;
            isPositive: import("vue").ComputedRef<boolean>;
            isNegative: import("vue").ComputedRef<boolean>;
        };
        useCacheBoolean(key: string, defaultValue?: boolean, options?: {
            ttl?: number;
            immediate?: boolean;
        }): {
            value: import("vue").ComputedRef<boolean>;
            loading: import("vue").ComputedRef<boolean>;
            error: import("vue").ComputedRef<Error>;
            exists: import("vue").ComputedRef<boolean>;
            toggle: () => Promise<void>;
            setTrue: () => Promise<void>;
            setFalse: () => Promise<void>;
            refresh: () => Promise<void>;
            isTrue: import("vue").ComputedRef<boolean>;
            isFalse: import("vue").ComputedRef<boolean>;
        };
        useCacheAsync<T extends import("./types").SerializableValue = import("./types").SerializableValue>(key: string, fetcher: () => Promise<T>, options?: {
            ttl?: number;
            immediate?: boolean;
            refreshInterval?: number;
            staleWhileRevalidate?: boolean;
        }): {
            data: import("vue").ComputedRef<T>;
            loading: import("vue").ComputedRef<boolean>;
            error: import("vue").ComputedRef<Error>;
            exists: import("vue").ComputedRef<boolean>;
            fetch: () => Promise<T>;
            refresh: () => Promise<T>;
            cleanup: () => void;
        };
        useCache: typeof import("./vue/use-cache").useCache;
        useCacheStats: typeof import("./vue/use-cache-stats").useCacheStats;
    }>;
    loadPresets(): Promise<typeof import("./presets")>;
};
export declare function createLazyCacheManager(options?: any): Promise<import("./core/cache-manager").CacheManager>;
export declare function loadCommonModules(): Promise<{
    isBrowser(): boolean;
    isNode(): boolean;
    isWebWorker(): boolean;
    isSSR(): boolean;
    isValidInput(input: unknown): input is NonNullable<unknown>;
    isEmpty(value: unknown): value is null | undefined | "";
    isNonEmptyString(value: unknown): value is string;
    safeJsonParse<T = unknown>(json: string, defaultValue: T): T;
    safeJsonStringify(value: unknown, space?: number): string;
    deepClone<T>(obj: T): T;
    deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T;
    once<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => ReturnType<T> | undefined;
    formatBytes(bytes: number, decimals?: number): string;
    formatNumber(num: number): string;
    formatPercentage(value: number, decimals?: number): string;
    generateId(prefix?: string): string;
    generateUUID(): string;
    delay(ms: number): Promise<void>;
    withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
    clamp(value: number, min: number, max: number): number;
    randomInt(min: number, max: number): number;
    EventEmitter: typeof import("./utils/event-emitter").EventEmitter;
    batchGet<T extends import("./types").SerializableValue = import("./types").SerializableValue>(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: import("./utils/batch-helpers").BatchGetOptions): Promise<Map<string, T | null>>;
    batchSet<T extends import("./types").SerializableValue = import("./types").SerializableValue>(cache: import("./core/cache-manager").CacheManager, items: Array<import("./utils/batch-helpers").BatchSetItem<T>>, options?: {
        concurrency?: number;
        collectErrors?: boolean;
    }): Promise<import("./utils/batch-helpers").BatchOperationResult>;
    batchRemove(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: {
        concurrency?: number;
    }): Promise<import("./utils/batch-helpers").BatchOperationResult>;
    batchHas(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: {
        concurrency?: number;
    }): Promise<Map<string, boolean>>;
    createBatchHelper(cache: import("./core/cache-manager").CacheManager): import("./utils/batch-helpers").BatchHelper;
    BatchHelper: typeof import("./utils/batch-helpers").BatchHelper;
    withCompression<T extends {
        set: any;
        get: any;
        has?: any;
        remove?: any;
    }>(cache: T, options?: import("./utils/compressor").CompressionOptions): T;
    Compressor: typeof import("./utils/compressor").Compressor;
    handleErrors(options?: import("./utils/error-handler").ErrorHandlerOptions): <T extends (...args: any[]) => any>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
    ErrorHandler: typeof import("./utils/error-handler").ErrorHandler;
    safeAsync: typeof import("./utils/error-handler").ErrorHandler.safeAsync;
    safeSync: typeof import("./utils/error-handler").ErrorHandler.safeSync;
    normalizeError: typeof import("./utils/error-handler").ErrorHandler.normalizeError;
    isErrorType: typeof import("./utils/error-handler").ErrorHandler.isErrorType;
    createThrottledEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>>(config?: import("./utils/event-throttle").ThrottleConfig): import("./utils/event-throttle").ThrottledEventEmitter<EventMap>;
    throttle<T>(fn: (batch: T[]) => void | Promise<void>, options?: import("./utils/event-throttle").ThrottleConfig): (item: T) => void;
    debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
    ThrottledEventEmitter: typeof import("./utils/event-throttle").ThrottledEventEmitter;
    createMinHeap<T = unknown>(): import("./utils/min-heap").MinHeap<T>;
    createMinHeapFromArray<T = unknown>(items: Array<{
        priority: number;
        data: T;
    }>): import("./utils/min-heap").MinHeap<T>;
    MinHeap: typeof import("./utils/min-heap").MinHeap;
    ObjectPool: typeof import("./utils/object-pool").ObjectPool;
    metadataPool: import("./utils/object-pool").ObjectPool<{
        createdAt: number;
        updatedAt: number;
        expiresAt: number | undefined;
        version: number;
        tags: string[];
    }>;
    cacheItemPool: import("./utils/object-pool").ObjectPool<{
        value: any;
        metadata: any;
    }>;
    createProfiler(config?: import("./utils/performance-profiler").ProfilerConfig): import("./utils/performance-profiler").PerformanceProfiler;
    enableProfiling(): void;
    disableProfiling(): void;
    generateGlobalReport(): string;
    PerformanceProfiler: typeof import("./utils/performance-profiler").PerformanceProfiler;
    globalProfiler: import("./utils/performance-profiler").PerformanceProfiler;
    withPrefetching<T extends {
        get: any;
        set: any;
        has: any;
    }>(cache: T, options?: import("./utils/prefetcher").PrefetcherOptions): T & {
        prefetcher: import("./utils/prefetcher").Prefetcher;
    };
    Prefetcher: typeof import("./utils/prefetcher").Prefetcher;
    withRetry<T extends (...args: any[]) => Promise<any>>(fn: T, options?: import("./utils/retry-manager").RetryOptions): T;
    withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: import("./utils/retry-manager").CircuitBreakerOptions): T;
    withFallback<T>(primary: () => Promise<T>, ...fallbacks: Array<() => Promise<T>>): () => Promise<T>;
    RetryManager: typeof import("./utils/retry-manager").RetryManager;
    CircuitBreaker: typeof import("./utils/retry-manager").CircuitBreaker;
    FallbackHandler: typeof import("./utils/retry-manager").FallbackHandler;
    createSerializationCache<T = string>(config?: import("./utils/serialization-cache").SerializationCacheConfig): import("./utils/serialization-cache").SerializationCache<T>;
    serializeWithCache(value: unknown, key?: string): string;
    deserializeWithCache<T = unknown>(serialized: string, key?: string): T;
    SerializationCache: typeof import("./utils/serialization-cache").SerializationCache;
    globalSerializeCache: import("./utils/serialization-cache").SerializationCache<string>;
    globalDeserializeCache: import("./utils/serialization-cache").SerializationCache<unknown>;
    ValidationError: typeof import("./utils/validator").ValidationError;
    Validator: typeof import("./utils/validator").Validator;
    validateKey: typeof import("./utils/validator").Validator.validateKey;
    validateValue: typeof import("./utils/validator").Validator.validateValue;
    validateTTL: typeof import("./utils/validator").Validator.validateTTL;
    validateEngine: typeof import("./utils/validator").Validator.validateEngine;
    validateSetOptions: typeof import("./utils/validator").Validator.validateSetOptions;
    validateSetInput: typeof import("./utils/validator").Validator.validateSetInput;
    MemoryEngine: typeof import("./engines/memory-engine").MemoryEngine;
    LocalStorageEngine: typeof import("./engines/local-storage-engine").LocalStorageEngine;
    SessionStorageEngine: typeof import("./engines/session-storage-engine").SessionStorageEngine;
    IndexedDBEngine: typeof import("./engines/indexeddb-engine").IndexedDBEngine;
    CookieEngine: typeof import("./engines/cookie-engine").CookieEngine;
}>;
export declare function loadAdvancedModules(): Promise<{
    CacheAnalyzer: typeof import("./core/cache-analyzer").CacheAnalyzer;
    createCacheAnalyzer: typeof import("./core/cache-analyzer").createCacheAnalyzer;
    WarmupManager: typeof import("./core/warmup-manager").WarmupManager;
    createWarmupManager: typeof import("./core/warmup-manager").createWarmupManager;
    SyncManager: typeof import("./core/sync-manager").SyncManager;
    PerformanceMonitor: typeof import("./core/performance-monitor").PerformanceMonitor;
}>;
export declare function loadAllModules(): Promise<{
    CacheAnalyzer: typeof import("./core/cache-analyzer").CacheAnalyzer;
    createCacheAnalyzer: typeof import("./core/cache-analyzer").createCacheAnalyzer;
    WarmupManager: typeof import("./core/warmup-manager").WarmupManager;
    createWarmupManager: typeof import("./core/warmup-manager").createWarmupManager;
    SyncManager: typeof import("./core/sync-manager").SyncManager;
    PerformanceMonitor: typeof import("./core/performance-monitor").PerformanceMonitor;
    getPresetOptions(preset: import("./presets").CachePreset): import("./types").CacheOptions;
    createBrowserCache(overrides?: Partial<import("./types").CacheOptions>): import("./core/cache-manager").CacheManager;
    createSSRCache(overrides?: Partial<import("./types").CacheOptions>): import("./core/cache-manager").CacheManager;
    createNodeCache(overrides?: Partial<import("./types").CacheOptions>): import("./core/cache-manager").CacheManager;
    createOfflineCache(overrides?: Partial<import("./types").CacheOptions>): import("./core/cache-manager").CacheManager;
    CacheProvider: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
        options: {
            type: import("vue").PropType<import("./types").CacheOptions>;
            default: () => {};
        };
    }>, () => import("vue").VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[], {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
        options: {
            type: import("vue").PropType<import("./types").CacheOptions>;
            default: () => {};
        };
    }>> & Readonly<{}>, {
        options: import("./types").CacheOptions;
    }, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
    useCacheList<T extends import("./types").SerializableValue = import("./types").SerializableValue>(key: string, defaultValue?: T[], options?: {
        ttl?: number;
        immediate?: boolean;
    }): {
        list: import("vue").ComputedRef<T[]>;
        loading: import("vue").ComputedRef<boolean>;
        error: import("vue").ComputedRef<Error>;
        exists: import("vue").ComputedRef<boolean>;
        add: (item: T) => Promise<void>;
        remove: (index: number) => Promise<void>;
        removeItem: (item: T) => Promise<void>;
        update: (index: number, item: T) => Promise<void>;
        insert: (index: number, item: T) => Promise<void>;
        clear: () => Promise<void>;
        refresh: () => Promise<void>;
        length: import("vue").ComputedRef<number>;
        isEmpty: import("vue").ComputedRef<boolean>;
        first: import("vue").ComputedRef<T>;
        last: import("vue").ComputedRef<T>;
    };
    useCacheObject<T extends Record<string, import("./types").SerializableValue> = Record<string, import("./types").SerializableValue>>(key: string, defaultValue?: T, options?: {
        ttl?: number;
        immediate?: boolean;
    }): {
        object: import("vue").ComputedRef<T>;
        loading: import("vue").ComputedRef<boolean>;
        error: import("vue").ComputedRef<Error>;
        exists: import("vue").ComputedRef<boolean>;
        setProperty: <K extends keyof T>(prop: K, value: T[K]) => Promise<void>;
        removeProperty: <K extends keyof T>(prop: K) => Promise<void>;
        merge: (updates: Partial<T>) => Promise<void>;
        clear: () => Promise<void>;
        refresh: () => Promise<void>;
        keys: import("vue").ComputedRef<string[]>;
        values: import("vue").ComputedRef<import("./types").SerializableValue[]>;
        entries: import("vue").ComputedRef<[string, import("./types").SerializableValue][]>;
        isEmpty: import("vue").ComputedRef<boolean>;
        size: import("vue").ComputedRef<number>;
    };
    useCacheCounter(key: string, defaultValue?: number, options?: {
        ttl?: number;
        immediate?: boolean;
        min?: number;
        max?: number;
    }): {
        count: import("vue").ComputedRef<number>;
        loading: import("vue").ComputedRef<boolean>;
        error: import("vue").ComputedRef<Error>;
        exists: import("vue").ComputedRef<boolean>;
        increment: (step?: number) => Promise<void>;
        decrement: (step?: number) => Promise<void>;
        reset: () => Promise<void>;
        set: (value: number) => Promise<void>;
        refresh: () => Promise<void>;
        isAtMin: import("vue").ComputedRef<boolean>;
        isAtMax: import("vue").ComputedRef<boolean>;
        isZero: import("vue").ComputedRef<boolean>;
        isPositive: import("vue").ComputedRef<boolean>;
        isNegative: import("vue").ComputedRef<boolean>;
    };
    useCacheBoolean(key: string, defaultValue?: boolean, options?: {
        ttl?: number;
        immediate?: boolean;
    }): {
        value: import("vue").ComputedRef<boolean>;
        loading: import("vue").ComputedRef<boolean>;
        error: import("vue").ComputedRef<Error>;
        exists: import("vue").ComputedRef<boolean>;
        toggle: () => Promise<void>;
        setTrue: () => Promise<void>;
        setFalse: () => Promise<void>;
        refresh: () => Promise<void>;
        isTrue: import("vue").ComputedRef<boolean>;
        isFalse: import("vue").ComputedRef<boolean>;
    };
    useCacheAsync<T extends import("./types").SerializableValue = import("./types").SerializableValue>(key: string, fetcher: () => Promise<T>, options?: {
        ttl?: number;
        immediate?: boolean;
        refreshInterval?: number;
        staleWhileRevalidate?: boolean;
    }): {
        data: import("vue").ComputedRef<T>;
        loading: import("vue").ComputedRef<boolean>;
        error: import("vue").ComputedRef<Error>;
        exists: import("vue").ComputedRef<boolean>;
        fetch: () => Promise<T>;
        refresh: () => Promise<T>;
        cleanup: () => void;
    };
    useCache: typeof import("./vue/use-cache").useCache;
    useCacheStats: typeof import("./vue/use-cache-stats").useCacheStats;
    isBrowser(): boolean;
    isNode(): boolean;
    isWebWorker(): boolean;
    isSSR(): boolean;
    isValidInput(input: unknown): input is NonNullable<unknown>;
    isEmpty(value: unknown): value is null | undefined | "";
    isNonEmptyString(value: unknown): value is string;
    safeJsonParse<T = unknown>(json: string, defaultValue: T): T;
    safeJsonStringify(value: unknown, space?: number): string;
    deepClone<T>(obj: T): T;
    deepMerge<T extends Record<string, unknown>>(target: T, ...sources: Partial<T>[]): T;
    once<T extends (...args: unknown[]) => unknown>(func: T): (...args: Parameters<T>) => ReturnType<T> | undefined;
    formatBytes(bytes: number, decimals?: number): string;
    formatNumber(num: number): string;
    formatPercentage(value: number, decimals?: number): string;
    generateId(prefix?: string): string;
    generateUUID(): string;
    delay(ms: number): Promise<void>;
    withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
    clamp(value: number, min: number, max: number): number;
    randomInt(min: number, max: number): number;
    EventEmitter: typeof import("./utils/event-emitter").EventEmitter;
    batchGet<T extends import("./types").SerializableValue = import("./types").SerializableValue>(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: import("./utils/batch-helpers").BatchGetOptions): Promise<Map<string, T | null>>;
    batchSet<T extends import("./types").SerializableValue = import("./types").SerializableValue>(cache: import("./core/cache-manager").CacheManager, items: Array<import("./utils/batch-helpers").BatchSetItem<T>>, options?: {
        concurrency?: number;
        collectErrors?: boolean;
    }): Promise<import("./utils/batch-helpers").BatchOperationResult>;
    batchRemove(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: {
        concurrency?: number;
    }): Promise<import("./utils/batch-helpers").BatchOperationResult>;
    batchHas(cache: import("./core/cache-manager").CacheManager, keys: string[], options?: {
        concurrency?: number;
    }): Promise<Map<string, boolean>>;
    createBatchHelper(cache: import("./core/cache-manager").CacheManager): import("./utils/batch-helpers").BatchHelper;
    BatchHelper: typeof import("./utils/batch-helpers").BatchHelper;
    withCompression<T extends {
        set: any;
        get: any;
        has?: any;
        remove?: any;
    }>(cache: T, options?: import("./utils/compressor").CompressionOptions): T;
    Compressor: typeof import("./utils/compressor").Compressor;
    handleErrors(options?: import("./utils/error-handler").ErrorHandlerOptions): <T extends (...args: any[]) => any>(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T>;
    ErrorHandler: typeof import("./utils/error-handler").ErrorHandler;
    safeAsync: typeof import("./utils/error-handler").ErrorHandler.safeAsync;
    safeSync: typeof import("./utils/error-handler").ErrorHandler.safeSync;
    normalizeError: typeof import("./utils/error-handler").ErrorHandler.normalizeError;
    isErrorType: typeof import("./utils/error-handler").ErrorHandler.isErrorType;
    createThrottledEmitter<EventMap extends Record<string, unknown> = Record<string, unknown>>(config?: import("./utils/event-throttle").ThrottleConfig): import("./utils/event-throttle").ThrottledEventEmitter<EventMap>;
    throttle<T>(fn: (batch: T[]) => void | Promise<void>, options?: import("./utils/event-throttle").ThrottleConfig): (item: T) => void;
    debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void;
    ThrottledEventEmitter: typeof import("./utils/event-throttle").ThrottledEventEmitter;
    createMinHeap<T = unknown>(): import("./utils/min-heap").MinHeap<T>;
    createMinHeapFromArray<T = unknown>(items: Array<{
        priority: number;
        data: T;
    }>): import("./utils/min-heap").MinHeap<T>;
    MinHeap: typeof import("./utils/min-heap").MinHeap;
    ObjectPool: typeof import("./utils/object-pool").ObjectPool;
    metadataPool: import("./utils/object-pool").ObjectPool<{
        createdAt: number;
        updatedAt: number;
        expiresAt: number | undefined;
        version: number;
        tags: string[];
    }>;
    cacheItemPool: import("./utils/object-pool").ObjectPool<{
        value: any;
        metadata: any;
    }>;
    createProfiler(config?: import("./utils/performance-profiler").ProfilerConfig): import("./utils/performance-profiler").PerformanceProfiler;
    enableProfiling(): void;
    disableProfiling(): void;
    generateGlobalReport(): string;
    PerformanceProfiler: typeof import("./utils/performance-profiler").PerformanceProfiler;
    globalProfiler: import("./utils/performance-profiler").PerformanceProfiler;
    withPrefetching<T extends {
        get: any;
        set: any;
        has: any;
    }>(cache: T, options?: import("./utils/prefetcher").PrefetcherOptions): T & {
        prefetcher: import("./utils/prefetcher").Prefetcher;
    };
    Prefetcher: typeof import("./utils/prefetcher").Prefetcher;
    withRetry<T extends (...args: any[]) => Promise<any>>(fn: T, options?: import("./utils/retry-manager").RetryOptions): T;
    withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: import("./utils/retry-manager").CircuitBreakerOptions): T;
    withFallback<T>(primary: () => Promise<T>, ...fallbacks: Array<() => Promise<T>>): () => Promise<T>;
    RetryManager: typeof import("./utils/retry-manager").RetryManager;
    CircuitBreaker: typeof import("./utils/retry-manager").CircuitBreaker;
    FallbackHandler: typeof import("./utils/retry-manager").FallbackHandler;
    createSerializationCache<T = string>(config?: import("./utils/serialization-cache").SerializationCacheConfig): import("./utils/serialization-cache").SerializationCache<T>;
    serializeWithCache(value: unknown, key?: string): string;
    deserializeWithCache<T = unknown>(serialized: string, key?: string): T;
    SerializationCache: typeof import("./utils/serialization-cache").SerializationCache;
    globalSerializeCache: import("./utils/serialization-cache").SerializationCache<string>;
    globalDeserializeCache: import("./utils/serialization-cache").SerializationCache<unknown>;
    ValidationError: typeof import("./utils/validator").ValidationError;
    Validator: typeof import("./utils/validator").Validator;
    validateKey: typeof import("./utils/validator").Validator.validateKey;
    validateValue: typeof import("./utils/validator").Validator.validateValue;
    validateTTL: typeof import("./utils/validator").Validator.validateTTL;
    validateEngine: typeof import("./utils/validator").Validator.validateEngine;
    validateSetOptions: typeof import("./utils/validator").Validator.validateSetOptions;
    validateSetInput: typeof import("./utils/validator").Validator.validateSetInput;
    LRUStrategy: typeof import("./strategies/eviction-strategies").LRUStrategy;
    LFUStrategy: typeof import("./strategies/eviction-strategies").LFUStrategy;
    FIFOStrategy: typeof import("./strategies/eviction-strategies").FIFOStrategy;
    MRUStrategy: typeof import("./strategies/eviction-strategies").MRUStrategy;
    RandomStrategy: typeof import("./strategies/eviction-strategies").RandomStrategy;
    TTLStrategy: typeof import("./strategies/eviction-strategies").TTLStrategy;
    ARCStrategy: typeof import("./strategies/eviction-strategies").ARCStrategy;
    EvictionStrategyFactory: typeof import("./strategies/eviction-strategies").EvictionStrategyFactory;
    StorageStrategy: typeof import("./strategies/storage-strategy").StorageStrategy;
    SecurityManager: typeof import("./security/security-manager").SecurityManager;
    AESCrypto: typeof import("./security/aes-crypto").AESCrypto;
    KeyObfuscator: typeof import("./security/key-obfuscator").KeyObfuscator;
    MemoryEngine: typeof import("./engines/memory-engine").MemoryEngine;
    LocalStorageEngine: typeof import("./engines/local-storage-engine").LocalStorageEngine;
    SessionStorageEngine: typeof import("./engines/session-storage-engine").SessionStorageEngine;
    IndexedDBEngine: typeof import("./engines/indexeddb-engine").IndexedDBEngine;
    CookieEngine: typeof import("./engines/cookie-engine").CookieEngine;
}>;
export default lazyModules;
//# sourceMappingURL=index-lazy.d.ts.map