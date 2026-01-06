/**
 * LocalStorage 存储适配器
 * @module @ldesign/cache/core/storage/local-storage
 */

import type { CacheItem, Serializer } from '../types'
import { BaseStorageAdapter } from './base'
import { isStorageAvailable } from '../utils'

/**
 * LocalStorage 存储适配器
 */
export class LocalStorageAdapter extends BaseStorageAdapter {
  private prefix: string

  constructor(serializer: Serializer<unknown>, prefix = 'ldesign-cache:') {
    super(serializer)
    this.prefix = prefix
  }

  getItem<T>(key: string): CacheItem<T> | null {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const data = localStorage.getItem(this.prefix + key)
      if (!data) {
        return null
      }
      return this.serializer.deserialize(data) as CacheItem<T>
    }
    catch {
      return null
    }
  }

  setItem<T>(key: string, item: CacheItem<T>): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      const data = this.serializer.serialize(item)
      if (typeof data === 'string') {
        localStorage.setItem(this.prefix + key, data)
      }
    }
    catch {
      // 忽略错误
    }
  }

  removeItem(key: string): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      localStorage.removeItem(this.prefix + key)
    }
    catch {
      // 忽略错误
    }
  }

  clear(): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      const keys = this.keys()
      for (const key of keys) {
        localStorage.removeItem(this.prefix + key)
      }
    }
    catch {
      // 忽略错误
    }
  }

  keys(): string[] {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length))
        }
      }
      return keys
    }
    catch {
      return []
    }
  }

  isAvailable(): boolean {
    return isStorageAvailable('localStorage')
  }
}

