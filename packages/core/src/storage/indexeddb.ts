/**
 * IndexedDB 存储适配器
 * @module @ldesign/cache/core/storage/indexeddb
 */

import type { CacheItem, Serializer } from '../types'
import { BaseStorageAdapter } from './base'
import { STORAGE } from '../constants'

/**
 * IndexedDB 存储适配器配置选项
 */
export interface IndexedDBAdapterOptions {
  /** 数据库名称 */
  dbName?: string
  /** 对象存储名称 */
  storeName?: string
  /** 数据库版本 */
  version?: number
  /** 键前缀 */
  prefix?: string
}

/**
 * IndexedDB 存储适配器
 * 
 * 特点：
 * - 支持大量数据存储（通常无大小限制）
 * - 全异步 API
 * - 支持事务
 * - 结构化数据存储
 * - 支持索引查询
 * 
 * @example
 * ```typescript
 * const adapter = new IndexedDBStorageAdapter(serializer, {
 *   dbName: 'my-cache',
 *   storeName: 'items',
 *   prefix: 'app:'
 * })
 * 
 * await adapter.initialize()
 * await adapter.setItem('key', { value: 'data' })
 * const item = await adapter.getItem('key')
 * ```
 */
export class IndexedDBStorageAdapter extends BaseStorageAdapter {
  private db: IDBDatabase | null = null
  private dbName: string
  private storeName: string
  private version: number
  private prefix: string
  private initPromise: Promise<void> | null = null

  constructor(serializer: Serializer, options: IndexedDBAdapterOptions = {}) {
    super(serializer)
    this.dbName = options.dbName ?? STORAGE.INDEXEDDB_NAME
    this.storeName = options.storeName ?? STORAGE.INDEXEDDB_STORE
    this.version = options.version ?? STORAGE.INDEXEDDB_VERSION
    this.prefix = options.prefix ?? ''
  }

  /**
   * 初始化数据库连接
   * 
   * @returns Promise<void>
   * @throws 如果 IndexedDB 不可用或初始化失败
   */
  async initialize(): Promise<void> {
    // 防止重复初始化
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.openDatabase()
    return this.initPromise
  }

  /**
   * 打开数据库连接
   */
  private openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        reject(new Error('IndexedDB is not available'))
        return
      }

      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        this.db = request.result

        // 监听数据库关闭事件
        this.db.onclose = () => {
          this.db = null
          this.initPromise = null
        }

        // 监听版本变化事件
        this.db.onversionchange = () => {
          this.db?.close()
          this.db = null
          this.initPromise = null
        }

        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 如果存储对象不存在，则创建
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          
          // 创建索引以支持按过期时间查询
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true })
        }
      }
    })
  }

  /**
   * 确保数据库已初始化
   */
  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    return this.db
  }

  /**
   * 获取完整的存储键
   */
  private getFullKey(key: string): string {
    return this.prefix + key
  }

  /**
   * 获取存储项
   * @param key - 键
   * @returns 缓存项，不存在返回 null
   */
  async getItem<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const db = await this.ensureInitialized()
      const fullKey = this.getFullKey(key)

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(fullKey)

        request.onerror = () => {
          reject(new Error(`Failed to get item: ${request.error?.message}`))
        }

        request.onsuccess = () => {
          const result = request.result as StoredItem<T> | undefined
          if (!result) {
            resolve(null)
            return
          }

          // 检查是否过期
          if (result.expiresAt && Date.now() > result.expiresAt) {
            // 异步删除过期项
            this.removeItem(key).catch(() => {})
            resolve(null)
            return
          }

          resolve(this.storedItemToCacheItem(result))
        }
      })
    }
    catch {
      return null
    }
  }

  /**
   * 设置存储项
   * @param key - 键
   * @param item - 缓存项
   */
  async setItem<T>(key: string, item: CacheItem<T>): Promise<void> {
    const db = await this.ensureInitialized()
    const fullKey = this.getFullKey(key)
    const storedItem = this.cacheItemToStoredItem(fullKey, item)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(storedItem)

      request.onerror = () => {
        reject(new Error(`Failed to set item: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * 删除存储项
   * @param key - 键
   */
  async removeItem(key: string): Promise<void> {
    const db = await this.ensureInitialized()
    const fullKey = this.getFullKey(key)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(fullKey)

      request.onerror = () => {
        reject(new Error(`Failed to remove item: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * 清空所有存储项
   */
  async clear(): Promise<void> {
    const db = await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)

      if (this.prefix) {
        // 如果有前缀，只删除带前缀的项
        const request = store.openCursor()
        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            const key = cursor.key as string
            if (key.startsWith(this.prefix)) {
              cursor.delete()
            }
            cursor.continue()
          }
          else {
            resolve()
          }
        }
        request.onerror = () => {
          reject(new Error(`Failed to clear items: ${request.error?.message}`))
        }
      }
      else {
        // 没有前缀，清空所有
        const request = store.clear()
        request.onerror = () => {
          reject(new Error(`Failed to clear store: ${request.error?.message}`))
        }
        request.onsuccess = () => {
          resolve()
        }
      }
    })
  }

  /**
   * 获取所有键
   * @returns 所有键数组
   */
  async keys(): Promise<string[]> {
    const db = await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onerror = () => {
        reject(new Error(`Failed to get keys: ${request.error?.message}`))
      }

      request.onsuccess = () => {
        const allKeys = request.result as string[]
        const filteredKeys = this.prefix
          ? allKeys
              .filter(key => key.startsWith(this.prefix))
              .map(key => key.slice(this.prefix.length))
          : allKeys
        resolve(filteredKeys)
      }
    })
  }

  /**
   * 检查是否可用
   * @returns 是否可用
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    return 'indexedDB' in window && window.indexedDB !== null
  }

  /**
   * 批量获取
   * @param keys - 键数组
   * @returns 缓存项映射
   */
  async getItems<T>(keys: string[]): Promise<Map<string, CacheItem<T> | null>> {
    const db = await this.ensureInitialized()
    const results = new Map<string, CacheItem<T> | null>()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)

      let completed = 0
      const total = keys.length

      if (total === 0) {
        resolve(results)
        return
      }

      for (const key of keys) {
        const fullKey = this.getFullKey(key)
        const request = store.get(fullKey)

        request.onsuccess = () => {
          const result = request.result as StoredItem<T> | undefined
          if (result && (!result.expiresAt || Date.now() <= result.expiresAt)) {
            results.set(key, this.storedItemToCacheItem(result))
          }
          else {
            results.set(key, null)
          }

          completed++
          if (completed === total) {
            resolve(results)
          }
        }

        request.onerror = () => {
          results.set(key, null)
          completed++
          if (completed === total) {
            resolve(results)
          }
        }
      }

      transaction.onerror = () => {
        reject(new Error(`Batch get failed: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 批量设置
   * @param items - 键值对数组
   */
  async setItems<T>(items: Array<{ key: string, item: CacheItem<T> }>): Promise<void> {
    const db = await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)

      for (const { key, item } of items) {
        const fullKey = this.getFullKey(key)
        const storedItem = this.cacheItemToStoredItem(fullKey, item)
        store.put(storedItem)
      }

      transaction.oncomplete = () => {
        resolve()
      }

      transaction.onerror = () => {
        reject(new Error(`Batch set failed: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 批量删除
   * @param keys - 键数组
   */
  async removeItems(keys: string[]): Promise<void> {
    const db = await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)

      for (const key of keys) {
        const fullKey = this.getFullKey(key)
        store.delete(fullKey)
      }

      transaction.oncomplete = () => {
        resolve()
      }

      transaction.onerror = () => {
        reject(new Error(`Batch remove failed: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 清理过期项
   * @returns 清理的项数
   */
  async cleanup(): Promise<number> {
    const db = await this.ensureInitialized()
    const now = Date.now()
    let count = 0

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('expiresAt')

      // 查找所有已过期的项
      const range = IDBKeyRange.upperBound(now)
      const request = index.openCursor(range)

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const item = cursor.value as StoredItem<unknown>
          // 只删除带前缀的项（如果设置了前缀）
          if (!this.prefix || item.key.startsWith(this.prefix)) {
            cursor.delete()
            count++
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        resolve(count)
      }

      transaction.onerror = () => {
        reject(new Error(`Cleanup failed: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 按标签查询
   * @param tag - 标签
   * @returns 匹配的缓存项数组
   */
  async getByTag<T>(tag: string): Promise<Array<CacheItem<T>>> {
    const db = await this.ensureInitialized()
    const results: Array<CacheItem<T>> = []

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('tags')
      const request = index.getAll(tag)

      request.onsuccess = () => {
        const items = request.result as Array<StoredItem<T>>
        const now = Date.now()

        for (const item of items) {
          // 检查前缀和过期时间
          if (this.prefix && !item.key.startsWith(this.prefix)) {
            continue
          }
          if (item.expiresAt && now > item.expiresAt) {
            continue
          }
          results.push(this.storedItemToCacheItem(item))
        }

        resolve(results)
      }

      request.onerror = () => {
        reject(new Error(`Get by tag failed: ${request.error?.message}`))
      }
    })
  }

  /**
   * 按标签删除
   * @param tag - 标签
   * @returns 删除的项数
   */
  async removeByTag(tag: string): Promise<number> {
    const db = await this.ensureInitialized()
    let count = 0

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('tags')
      const request = index.openCursor(tag)

      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          const item = cursor.value as StoredItem<unknown>
          if (!this.prefix || item.key.startsWith(this.prefix)) {
            cursor.delete()
            count++
          }
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        resolve(count)
      }

      transaction.onerror = () => {
        reject(new Error(`Remove by tag failed: ${transaction.error?.message}`))
      }
    })
  }

  /**
   * 获取存储大小估算
   * @returns 存储使用情况
   */
  async getStorageUsage(): Promise<StorageUsage> {
    const db = await this.ensureInitialized()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => {
        resolve({
          count: request.result,
          // IndexedDB 没有直接的大小 API，需要遍历计算
          // 这里只返回项数
        })
      }

      request.onerror = () => {
        reject(new Error(`Get storage usage failed: ${request.error?.message}`))
      }
    })
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  /**
   * 删除整个数据库
   */
  async deleteDatabase(): Promise<void> {
    this.close()

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => {
        reject(new Error(`Delete database failed: ${request.error?.message}`))
      }
    })
  }

  /**
   * 将 CacheItem 转换为存储格式
   */
  private cacheItemToStoredItem<T>(key: string, item: CacheItem<T>): StoredItem<T> {
    return {
      key,
      value: item.value,
      createdAt: item.createdAt,
      lastAccessedAt: item.lastAccessedAt,
      accessCount: item.accessCount,
      expiresAt: item.expiresAt,
      ttl: item.ttl,
      tags: item.tags ?? [],
      namespace: item.namespace,
      version: item.version,
      dependencies: item.dependencies,
    }
  }

  /**
   * 将存储格式转换为 CacheItem
   */
  private storedItemToCacheItem<T>(stored: StoredItem<T>): CacheItem<T> {
    // 移除前缀得到原始键
    const originalKey = this.prefix && stored.key.startsWith(this.prefix)
      ? stored.key.slice(this.prefix.length)
      : stored.key

    return {
      key: originalKey,
      value: stored.value,
      createdAt: stored.createdAt,
      lastAccessedAt: stored.lastAccessedAt,
      accessCount: stored.accessCount,
      expiresAt: stored.expiresAt,
      ttl: stored.ttl,
      tags: stored.tags.length > 0 ? stored.tags : undefined,
      namespace: stored.namespace,
      version: stored.version,
      dependencies: stored.dependencies,
    }
  }
}

/**
 * 存储在 IndexedDB 中的项格式
 */
interface StoredItem<T> {
  key: string
  value: T
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt?: number
  ttl?: number
  tags: string[]
  namespace?: string
  version?: number
  dependencies?: string[]
}

/**
 * 存储使用情况
 */
interface StorageUsage {
  /** 存储项数量 */
  count: number
}

/**
 * 创建 IndexedDB 适配器实例
 * 
 * @param serializer - 序列化器
 * @param options - 配置选项
 * @returns IndexedDB 适配器实例
 */
export function createIndexedDBAdapter(
  serializer: Serializer,
  options?: IndexedDBAdapterOptions,
): IndexedDBStorageAdapter {
  return new IndexedDBStorageAdapter(serializer, options)
}
