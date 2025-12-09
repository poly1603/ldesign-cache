/**
 * LocalStorage 存储适配器
 * @module @ldesign/cache/core/storage/local-storage
 */
import type { CacheItem, Serializer } from '../types';
import { BaseStorageAdapter } from './base';
/**
 * LocalStorage 存储适配器
 */
export declare class LocalStorageAdapter extends BaseStorageAdapter {
    private prefix;
    constructor(serializer: Serializer, prefix?: string);
    getItem<T>(key: string): CacheItem<T> | null;
    setItem<T>(key: string, item: CacheItem<T>): void;
    removeItem(key: string): void;
    clear(): void;
    keys(): string[];
    isAvailable(): boolean;
}
