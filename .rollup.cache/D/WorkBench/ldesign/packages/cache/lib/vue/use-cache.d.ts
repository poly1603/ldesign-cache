import type { ComputedRef } from 'vue';
import type { CacheStats, SerializableValue, SetOptions, UseCacheOptions } from '../types';
import { CacheManager } from '../core/cache-manager';
/**
 * 响应式缓存返回类型
 */
export interface ReactiveCache<T extends SerializableValue = SerializableValue> {
    /** 缓存值 */
    value: ComputedRef<T | null>;
    /** 是否正在加载 */
    loading: ComputedRef<boolean>;
    /** 错误信息 */
    error: ComputedRef<Error | null>;
    /** 是否存在 */
    exists: ComputedRef<boolean>;
    /** 是否为空 */
    isEmpty: ComputedRef<boolean>;
    /** 是否有效（非null/undefined） */
    isValid: ComputedRef<boolean>;
    /** 是否有错误 */
    hasError: ComputedRef<boolean>;
    /** 是否就绪（非加载中且无错误） */
    isReady: ComputedRef<boolean>;
    /** 设置缓存值 */
    set: (value: T, options?: SetOptions) => Promise<void>;
    /** 设置缓存值（带回调） */
    setWithCallback: (value: T, options?: SetOptions, onSuccess?: () => void, onError?: (error: Error) => void) => Promise<void>;
    /** 刷新缓存 */
    refresh: () => Promise<void>;
    /** 刷新缓存（带回调） */
    refreshWithCallback: (onSuccess?: () => void, onError?: (error: Error) => void) => Promise<void>;
    /** 移除缓存 */
    remove: () => Promise<void>;
    /** 启用自动保存，返回停止函数 */
    enableAutoSave: (options?: {
        ttl?: number;
        throttle?: number;
        debounce?: number;
        immediate?: boolean;
    }) => () => void;
}
/**
 * useCache 返回类型
 *
 * 提供完整的缓存管理功能，包括基础操作、统计信息、状态管理和响应式缓存
 */
export interface UseCacheReturn {
    /** 设置缓存项 */
    set: <T extends SerializableValue = SerializableValue>(key: string, value: T, options?: SetOptions) => Promise<void>;
    /** 获取缓存项 */
    get: <T extends SerializableValue = SerializableValue>(key: string) => Promise<T | null>;
    /** 移除缓存项 */
    remove: (key: string) => Promise<void>;
    /** 清空所有缓存 */
    clear: () => Promise<void>;
    /** 检查缓存项是否存在 */
    has: (key: string) => Promise<boolean>;
    /** 获取所有缓存键 */
    keys: () => Promise<string[]>;
    /** 清理过期缓存 */
    cleanup: () => Promise<void>;
    /** 获取缓存统计信息 */
    getStats: () => Promise<CacheStats>;
    /** 刷新统计信息 */
    refreshStats: () => Promise<void>;
    /** 响应式统计信息 */
    stats: ComputedRef<CacheStats | null>;
    /** 是否正在加载 */
    loading: ComputedRef<boolean>;
    /** 错误信息 */
    error: ComputedRef<Error | null>;
    /** 是否已准备就绪 */
    isReady: ComputedRef<boolean>;
    /** 是否有错误 */
    hasError: ComputedRef<boolean>;
    /** 创建响应式缓存 */
    useReactiveCache: <T extends SerializableValue = SerializableValue>(key: string, defaultValue?: T) => ReactiveCache<T>;
    /** 简单值缓存 */
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
    /** 双向绑定缓存 */
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
    /** 缓存管理器实例 */
    manager: CacheManager;
}
/**
 * Vue 3 缓存组合式函数
 */
export declare function useCache(options?: UseCacheOptions): UseCacheReturn;
