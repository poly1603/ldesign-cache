export type StorageEngine = 'localStorage' | 'sessionStorage' | 'cookie' | 'indexedDB' | 'memory';
export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'binary';
export type SerializableValue = string | number | boolean | null | undefined | SerializableObject | SerializableArray;
export interface SerializableObject {
    [key: string]: SerializableValue;
}
export interface SerializableArray extends Array<SerializableValue> {
}
export type CacheKey = string | number | symbol;
export interface CacheMetadata {
    createdAt: number;
    lastAccessedAt: number;
    expiresAt?: number;
    dataType: DataType;
    size: number;
    accessCount: number;
    engine: StorageEngine;
    encrypted: boolean;
}
export interface CacheItem<T = SerializableValue> {
    key: string;
    value: T;
    metadata: CacheMetadata;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm?: 'AES' | 'DES' | 'custom';
    secretKey?: string;
    customEncrypt?: (data: string) => string;
    customDecrypt?: (data: string) => string;
}
export interface ObfuscationConfig {
    enabled: boolean;
    prefix?: string;
    algorithm?: 'hash' | 'base64' | 'custom';
    customObfuscate?: (key: string) => string;
    customDeobfuscate?: (key: string) => string;
}
export interface SecurityConfig {
    encryption: EncryptionConfig;
    obfuscation: ObfuscationConfig;
}
export interface BaseEngineOptions {
    enabled?: boolean;
    maxSize?: number;
}
export interface LocalStorageEngineOptions extends BaseEngineOptions {
    keyPrefix?: string;
}
export interface SessionStorageEngineOptions extends BaseEngineOptions {
    keyPrefix?: string;
}
export interface CookieEngineOptions extends BaseEngineOptions {
    domain?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    httpOnly?: boolean;
}
export interface IndexedDBEngineOptions extends BaseEngineOptions {
    dbName?: string;
    version?: number;
    storeName?: string;
}
export interface MemoryEngineOptions extends BaseEngineOptions {
    maxItems?: number;
    cleanupInterval?: number;
    evictionStrategy?: string;
}
export interface StorageEngineConfig {
    localStorage?: LocalStorageEngineOptions;
    sessionStorage?: SessionStorageEngineOptions;
    cookie?: CookieEngineOptions;
    indexedDB?: IndexedDBEngineOptions;
    memory?: MemoryEngineOptions;
}
export type EngineOptions = LocalStorageEngineOptions | SessionStorageEngineOptions | CookieEngineOptions | IndexedDBEngineOptions | MemoryEngineOptions;
export interface StorageStrategyConfig {
    enabled: boolean;
    sizeThresholds?: {
        small: number;
        medium: number;
        large: number;
    };
    ttlThresholds?: {
        short: number;
        medium: number;
        long: number;
    };
    enginePriority?: StorageEngine[];
}
export interface CacheOptions {
    maxMemory?: number;
    enablePrefetch?: boolean;
    prefetch?: {
        strategy?: 'markov' | 'lru' | 'association';
        fetcher?: (key: string) => Promise<SerializableValue>;
    };
    defaultEngine?: StorageEngine;
    defaultTTL?: number;
    keyPrefix?: string;
    debug?: boolean;
    security?: Partial<SecurityConfig>;
    engines?: Partial<StorageEngineConfig>;
    strategy?: Partial<StorageStrategyConfig>;
    maxItems?: number;
    cleanupInterval?: number;
}
export interface IStorageEngine {
    readonly name: StorageEngine;
    readonly available: boolean;
    readonly maxSize: number;
    readonly usedSize: number;
    setItem: (key: string, value: string, ttl?: number) => Promise<void>;
    getItem: (key: string) => Promise<string | null>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    keys: () => Promise<string[]>;
    hasItem: (key: string) => Promise<boolean>;
    length: () => Promise<number>;
    cleanup: () => Promise<void>;
}
export interface ICacheManager {
    set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions) => Promise<void>;
    get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T | null>;
    remove: (key: string) => Promise<void>;
    clear: (engine?: StorageEngine) => Promise<void>;
    has: (key: string) => Promise<boolean>;
    keys: (engine?: StorageEngine) => Promise<string[]>;
    getMetadata: (key: string) => Promise<CacheMetadata | null>;
    getStats: () => Promise<CacheStats>;
    cleanup: () => Promise<void>;
    destroy: () => Promise<void>;
}
export interface SetOptions {
    ttl?: number;
    engine?: StorageEngine;
    encrypt?: boolean;
    obfuscateKey?: boolean;
    dataType?: DataType;
}
export interface GetOptions {
    engine?: StorageEngine;
    decrypt?: boolean;
    defaultValue?: SerializableValue;
}
export interface RemoveOptions {
    engine?: StorageEngine;
}
export interface ClearOptions {
    engine?: StorageEngine;
    all?: boolean;
}
export interface CacheStats {
    totalItems: number;
    totalSize: number;
    engines: Record<StorageEngine, EngineStats>;
    hitRate: number;
    expiredItems: number;
}
export interface EngineStats {
    itemCount: number;
    size: number;
    available: boolean;
    hits: number;
    misses: number;
}
export interface StorageStrategyResult {
    engine: StorageEngine;
    reason: string;
    confidence: number;
}
export type CacheEventType = 'set' | 'get' | 'remove' | 'clear' | 'expired' | 'error' | 'strategy';
export interface CacheEvent<T = any> {
    type: CacheEventType;
    key: string;
    value?: T;
    engine: StorageEngine;
    timestamp: number;
    error?: Error;
    strategy?: {
        reason: string;
        confidence: number;
        dataSize: number;
        dataType: string;
        ttl?: number;
    };
}
export type CacheEventListener<T = any> = (event: CacheEvent<T>) => void;
export interface EventMap {
    set: CacheEvent;
    get: CacheEvent;
    remove: CacheEvent;
    clear: CacheEvent;
    expired: CacheEvent;
    error: CacheEvent;
    strategy: CacheEvent;
}
export type EventListener<K extends keyof EventMap = keyof EventMap> = (event: EventMap[K]) => void;
export type ErrorType = 'VALIDATION_ERROR' | 'STORAGE_ERROR' | 'SERIALIZATION_ERROR' | 'ENCRYPTION_ERROR' | 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'UNKNOWN_ERROR';
export interface CacheError extends Error {
    type: ErrorType;
    code?: string;
    originalError?: Error;
    context?: Record<string, unknown>;
}
export interface UseCacheOptions extends Omit<CacheOptions, 'keyPrefix'> {
    keyPrefix?: string;
    immediate?: boolean;
    cleanupOnUnmount?: boolean;
}
export declare function isSerializableValue(value: unknown): value is SerializableValue;
export declare function isValidStorageEngine(engine: string): engine is StorageEngine;
export declare function isValidDataType(type: string): type is DataType;
export declare function isValidCacheEventType(type: string): type is CacheEventType;
export type PickByType<T, U> = {
    [K in keyof T as T[K] extends U ? K : never]: T[K];
};
export type OmitByType<T, U> = {
    [K in keyof T as T[K] extends U ? never : K]: T[K];
};
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
export type NonNullable<T> = T extends null | undefined ? never : T;
export type Exact<T, U> = T extends U ? (U extends T ? T : never) : never;
//# sourceMappingURL=index.d.ts.map