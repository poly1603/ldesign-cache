import type { SerializableValue } from '../types';
export declare function useCacheList<T extends SerializableValue = SerializableValue>(key: string, defaultValue?: T[], options?: {
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
export declare function useCacheObject<T extends Record<string, SerializableValue> = Record<string, SerializableValue>>(key: string, defaultValue?: T, options?: {
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
    values: import("vue").ComputedRef<SerializableValue[]>;
    entries: import("vue").ComputedRef<[string, SerializableValue][]>;
    isEmpty: import("vue").ComputedRef<boolean>;
    size: import("vue").ComputedRef<number>;
};
export declare function useCacheCounter(key: string, defaultValue?: number, options?: {
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
export declare function useCacheBoolean(key: string, defaultValue?: boolean, options?: {
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
export declare function useCacheAsync<T extends SerializableValue = SerializableValue>(key: string, fetcher: () => Promise<T>, options?: {
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
//# sourceMappingURL=use-cache-helpers.d.ts.map