/**
 * SessionStorage 存储适配器
 * @module @ldesign/cache/core/storage/session-storage
 */

import type { CacheItem, Serializer } from '../types'
import { BaseStorageAdapter } from './base'
import { isStorageAvailable } from '../utils'

/**
 * SessionStorage 存储适配器
 */
export class SessionStorageAdapter extends BaseStorageAdapter {
  private prefix: string

  constructor(serializer: Serializer, prefix = 'ldesign-cache:') {
    super(serializer)
    this.prefix = prefix
  }

  getItem<T>(key: string): CacheItem<T> | null {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const data = sessionStorage.getItem(this.prefix + key)
      if (!data) {
        return null
      }
      return this.serializer.deserialize<CacheItem<T>>(data)
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
      sessionStorage.setItem(this.prefix + key, data)
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
      sessionStorage.removeItem(this.prefix + key)
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
        sessionStorage.removeItem(this.prefix + key)
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
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
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
    return isStorageAvailable('sessionStorage')
  }
}

