import type { StorageEngineConfig } from '../types'

import { BaseStorageEngine } from './base-engine'

/**
 * IndexedDB 存储引擎
 */
export class IndexedDBEngine extends BaseStorageEngine {
  readonly name = 'indexedDB' as const
  readonly maxSize = 50 * 1024 * 1024 // 默认 50MB

  private db: IDBDatabase | null = null
  private dbName: string
  private version: number
  private storeName: string

  private constructor(config?: StorageEngineConfig['indexedDB']) {
    super()
    this.dbName = config?.dbName || 'ldesign_cache_db'
    this.version = config?.version || 1
    this.storeName = config?.storeName || 'cache_store'
  }

  /**
   * 创建 IndexedDB 引擎实例
   */
  static async create(
    config?: StorageEngineConfig['indexedDB'],
  ): Promise<IndexedDBEngine> {
    const engine = new IndexedDBEngine(config)
    await engine.initialize()
    return engine
  }

  get available(): boolean {
    return (
      typeof window !== 'undefined'
      && 'indexedDB' in window
      && window.indexedDB !== null
      && this.db !== null
    )
  }

  /**
   * 初始化数据库
   */
  private async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`))
      }

      request.onsuccess = () => {
        this.db = request.result
        this.updateUsedSize()
          .then(() => resolve())
          .catch(console.error)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('expiresAt', 'expiresAt', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  /**
   * 获取事务
   */
  private getTransaction(
    mode: IDBTransactionMode = 'readonly',
  ): IDBTransaction {
    if (!this.db) {
      throw new Error('IndexedDB is not initialized')
    }
    return this.db.transaction([this.storeName], mode)
  }

  /**
   * 获取对象存储
   */
  private getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    const transaction = this.getTransaction(mode)
    return transaction.objectStore(this.storeName)
  }

  /**
   * 执行 IndexedDB 请求
   */
  private async executeRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * 设置缓存项
   */
  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.available) {
      throw new Error('IndexedDB is not available')
    }

    const store = this.getStore('readwrite')
    const now = Date.now()

    const item = {
      key,
      value,
      createdAt: now,
      expiresAt: ttl ? now + ttl : undefined,
    }

    await this.executeRequest(store.put(item))
    await this.updateUsedSize()
  }

  /**
   * 获取缓存项
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.available) {
      return null
    }

    try {
      const store = this.getStore('readonly')
      const item = await this.executeRequest(store.get(key))

      if (!item) {
        return null
      }

      // 检查是否过期
      if (item.expiresAt && Date.now() > item.expiresAt) {
        await this.removeItem(key)
        return null
      }

      return item.value
    }
    catch (error) {
      console.warn('Error getting item from IndexedDB:', error)
      return null
    }
  }

  /**
   * 删除缓存项
   */
  async removeItem(key: string): Promise<void> {
    if (!this.available) {
      return
    }

    try {
      const store = this.getStore('readwrite')
      await this.executeRequest(store.delete(key))
      await this.updateUsedSize()
    }
    catch (error) {
      console.warn('Error removing item from IndexedDB:', error)
    }
  }

  /**
   * 清空所有缓存项
   */
  async clear(): Promise<void> {
    if (!this.available) {
      return
    }

    try {
      const store = this.getStore('readwrite')
      await this.executeRequest(store.clear())
      this._usedSize = 0
    }
    catch (error) {
      console.warn('Error clearing IndexedDB:', error)
    }
  }

  /**
   * 获取所有键名
   */
  async keys(): Promise<string[]> {
    if (!this.available) {
      return []
    }

    try {
      const store = this.getStore('readonly')
      const keys = await this.executeRequest(store.getAllKeys())
      return keys.map(key => String(key))
    }
    catch (error) {
      console.warn('Error getting keys from IndexedDB:', error)
      return []
    }
  }

  /**
   * 获取缓存项数量
   */
  async length(): Promise<number> {
    if (!this.available) {
      return 0
    }

    try {
      const store = this.getStore('readonly')
      return await this.executeRequest(store.count())
    }
    catch (error) {
      console.warn('Error getting count from IndexedDB:', error)
      return 0
    }
  }

  /**
   * 清理过期项
   */
  async cleanup(): Promise<void> {
    if (!this.available) {
      return
    }

    try {
      const store = this.getStore('readwrite')
      const index = store.index('expiresAt')
      const now = Date.now()

      // 获取所有过期项
      const range = IDBKeyRange.upperBound(now)
      const cursor = await this.executeRequest(index.openCursor(range))

      const deletePromises: Promise<void>[] = []

      if (cursor) {
        ; (cursor as any).onsuccess = (event: any) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            deletePromises.push(
              this.executeRequest(store.delete(cursor.primaryKey)),
            )
            cursor.continue()
          }
        }
      }

      await Promise.all(deletePromises)
      await this.updateUsedSize()
    }
    catch (error) {
      console.warn('Error cleaning up IndexedDB:', error)
    }
  }

  /**
   * 获取数据库大小估算
   */
  async getDatabaseSize(): Promise<number> {
    if (!this.available) {
      return 0
    }

    try {
      const store = this.getStore('readonly')
      const items = await this.executeRequest(store.getAll())

      let totalSize = 0
      for (const item of items) {
        const itemSize = this.calculateSize(JSON.stringify(item))
        totalSize += itemSize
      }

      return totalSize
    }
    catch (error) {
      console.warn('Error calculating IndexedDB size:', error)
      return 0
    }
  }

  /**
   * 更新使用大小
   */
  protected async updateUsedSize(): Promise<void> {
    this._usedSize = await this.getDatabaseSize()
  }

  /**
   * 批量设置缓存项（优化版本 - 使用事务）
   * 
   * IndexedDB 的批量操作使用单个事务，性能显著提升
   * 
   * @param items - 要设置的键值对数组
   * @returns 设置结果数组
   */
  async batchSet(items: Array<{ key: string, value: string, ttl?: number }>): Promise<boolean[]> {
    if (!this.available) {
      return items.map(() => false)
    }

    const results: boolean[] = []
    const now = Date.now()

    try {
      // 使用单个事务批量写入
      const transaction = this.getTransaction('readwrite')
      const store = transaction.objectStore(this.storeName)

      for (const { key, value, ttl } of items) {
        try {
          const item = {
            key,
            value,
            createdAt: now,
            expiresAt: ttl ? now + ttl : undefined,
          }

          store.put(item)
          results.push(true)
        }
        catch (error) {
          console.error(`Failed to set ${key}:`, error)
          results.push(false)
        }
      }

      // 等待事务完成
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })

      // 批量操作后一次性更新大小
      await this.updateUsedSize()
    }
    catch (error) {
      console.error('Batch set transaction failed:', error)
      // 如果事务失败，所有操作都失败
      return items.map(() => false)
    }

    return results
  }

  /**
   * 批量获取缓存项（优化版本 - 使用事务）
   * 
   * @param keys - 要获取的键数组
   * @returns 值数组（未找到的为 null）
   */
  async batchGet(keys: string[]): Promise<Array<string | null>> {
    if (!this.available) {
      return keys.map(() => null)
    }

    const results: Array<string | null> = []
    const expiredKeys: string[] = []
    const now = Date.now()

    try {
      const transaction = this.getTransaction('readonly')
      const store = transaction.objectStore(this.storeName)

      // 并行发起所有获取请求
      const promises = keys.map(key => this.executeRequest(store.get(key)))
      const items = await Promise.all(promises)

      for (let i = 0; i < keys.length; i++) {
        const item = items[i]

        if (!item) {
          results.push(null)
          continue
        }

        // 检查是否过期
        if (item.expiresAt && now > item.expiresAt) {
          expiredKeys.push(keys[i])
          results.push(null)
          continue
        }

        results.push(item.value)
      }

      // 批量删除过期项
      if (expiredKeys.length > 0) {
        await this.batchRemove(expiredKeys)
      }
    }
    catch (error) {
      console.error('Batch get failed:', error)
      return keys.map(() => null)
    }

    return results
  }

  /**
   * 批量删除缓存项（优化版本 - 使用事务）
   * 
   * @param keys - 要删除的键数组
   * @returns 删除结果数组
   */
  async batchRemove(keys: string[]): Promise<boolean[]> {
    if (!this.available) {
      return keys.map(() => false)
    }

    const results: boolean[] = []

    try {
      const transaction = this.getTransaction('readwrite')
      const store = transaction.objectStore(this.storeName)

      for (const key of keys) {
        try {
          store.delete(key)
          results.push(true)
        }
        catch (error) {
          console.error(`Failed to delete ${key}:`, error)
          results.push(false)
        }
      }

      // 等待事务完成
      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })

      // 批量删除后一次性更新大小
      await this.updateUsedSize()
    }
    catch (error) {
      console.error('Batch remove transaction failed:', error)
      return keys.map(() => false)
    }

    return results
  }

  /**
   * 批量检查键是否存在（优化版本）
   * 
   * @param keys - 要检查的键数组
   * @returns 存在性检查结果数组
   */
  async batchHas(keys: string[]): Promise<boolean[]> {
    if (!this.available) {
      return keys.map(() => false)
    }

    try {
      const store = this.getStore('readonly')
      const promises = keys.map(key =>
        this.executeRequest(store.getKey(key))
          .then(result => result !== undefined)
          .catch(() => false)
      )

      return await Promise.all(promises)
    }
    catch (error) {
      console.error('Batch has check failed:', error)
      return keys.map(() => false)
    }
  }
}
