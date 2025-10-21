import type { ComputedRef } from 'vue';
import type { CacheStats, SerializableValue, SetOptions, UseCacheOptions } from '../types';
import { CacheManager } from '../core/cache-manager';
export interface ReactiveCache<T extends SerializableValue = SerializableValue> {
    value: ComputedRef<T | null>;
    loading: ComputedRef<boolean>;
    error: ComputedRef<Error | null>;
    exists: ComputedRef<boolean>;
    isEmpty: ComputedRef<boolean>;
    isValid: ComputedRef<boolean>;
    hasError: ComputedRef<boolean>;
    isReady: ComputedRef<boolean>;
    set: (value: T, options?: SetOptions) => Promise<void>;
    setWithCallback: (value: T, options?: SetOptions, onSuccess?: () => void, onError?: (error: Error) => void) => Promise<void>;
    refresh: () => Promise<void>;
    refreshWithCallback: (onSuccess?: () => void, onError?: (error: Error) => void) => Promise<void>;
    remove: () => Promise<void>;
    enableAutoSave: (options?: {
        ttl?: number;
        throttle?: number;
        debounce?: number;
        immediate?: boolean;
    }) => () => void;
}
export interface UseCacheReturn {
    set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions) => Promise<void>;
    get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T | null>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    has: (key: string) => Promise<boolean>;
    keys: () => Promise<string[]>;
    cleanup: () => Promise<void>;
    getStats: () => Promise<CacheStats>;
    refreshStats: () => Promise<void>;
    stats: ComputedRef<CacheStats | null>;
    loading: ComputedRef<boolean>;
    error: ComputedRef<Error | null>;
    isReady: ComputedRef<boolean>;
    hasError: ComputedRef<boolean>;
    useReactiveCache: <T extends SerializableValue = SerializableValue>(key: string, defaultValue?: T) => ReactiveCache<T>;
    useCacheValue: <T extends SerializableValue = SerializableValue>(key: string, defaultValue?: T, options?: {
        ttl?: number;
        immediate?: boolean;
    }) => {
        value: ComputedRef<T | null>;
        loading: ComputedRef<boolean>;
        error: ComputedRef<Error | null>;
        exists: ComputedRef<boolean>;
        isEmpty: ComputedRef<boolean>;
        isValid: ComputedRef<boolean>;
        set: (value: T) => Promise<void>;
        refresh: () => Promise<void>;
        remove: () => Promise<void>;
    };
    useCacheSync: <T extends SerializableValue = SerializableValue>(key: string, defaultValue?: T, options?: {
        ttl?: number;
        throttle?: number;
    }) => {
        value: ComputedRef<T | null>;
        loading: ComputedRef<boolean>;
        error: ComputedRef<Error | null>;
        exists: ComputedRef<boolean>;
        refresh: () => Promise<void>;
        remove: () => Promise<void>;
    };
    manager: CacheManager;
}
export declare function useCache(options?: UseCacheOptions): UseCacheReturn;
//# sourceMappingURL=use-cache.d.ts.map