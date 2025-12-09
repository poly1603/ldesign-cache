/**
 * 内存存储适配器
 * @module @ldesign/cache/core/storage/memory
 */
import type { CacheItem, Serializer } from '../types';
import { BaseStorageAdapter } from './base';
/**
 * 内存存储适配器
 * 使用 Map 存储数据
 */
export declare class MemoryStorageAdapter extends BaseStorageAdapter {
    private storage;
    constructor(serializer: Serializer);
    getItem<T>(key: string): CacheItem<T> | null;
    setItem<T>(key: string, item: CacheItem<T>): void;
    removeItem(key: string): void;
    clear(): void;
    keys(): string[];
    isAvailable(): boolean;
}
