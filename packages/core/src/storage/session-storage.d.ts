/**
 * SessionStorage 存储适配器
 * @module @ldesign/cache/core/storage/session-storage
 */
import type { CacheItem, Serializer } from '../types';
import { BaseStorageAdapter } from './base';
/**
 * SessionStorage 存储适配器
 */
export declare class SessionStorageAdapter extends BaseStorageAdapter {
    private prefix;
    constructor(serializer: Serializer, prefix?: string);
    getItem<T>(key: string): CacheItem<T> | null;
    setItem<T>(key: string, item: CacheItem<T>): void;
    removeItem(key: string): void;
    clear(): void;
    keys(): string[];
    isAvailable(): boolean;
}
