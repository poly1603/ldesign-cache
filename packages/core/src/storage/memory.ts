/**
 * 内存存储适配器
 * @module @ldesign/cache/core/storage/memory
 */

import type { CacheItem, Serializer } from '../types'
import { BaseStorageAdapter } from './base'

/**
 * 内存存储适配器
 * 使用 Map 存储数据
 */
export class MemoryStorageAdapter extends BaseStorageAdapter {
  private storage = new Map<string, CacheItem<any>>()

  constructor(serializer: Serializer) {
    super(serializer)
  }

  getItem<T>(key: string): CacheItem<T> | null {
    return this.storage.get(key) ?? null
  }

  setItem<T>(key: string, item: CacheItem<T>): void {
    this.storage.set(key, item)
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }

  keys(): string[] {
    return Array.from(this.storage.keys())
  }

  isAvailable(): boolean {
    return true
  }
}

