import type { StorageEngineConfig } from '../types'

import { BaseStorageEngine } from './base-engine'

/**
 * localStorage 存储引擎
 */
export class LocalStorageEngine extends BaseStorageEngine {
  readonly name = 'localStorage' as const
  readonly maxSize: number
  private keyPrefix: string

  constructor(config?: StorageEngineConfig['localStorage']) {
    super()
    this.maxSize = config?.maxSize || 5 * 1024 * 1024 // 默认 5MB
    this.keyPrefix = config?.keyPrefix || 'ldesign_cache_'

    // 初始化时计算已使用大小（仅在可用时，避免 SSR/Node 环境报错）
    if (this.available) {
      this.updateUsedSize().catch(console.error)
    }
  }

  get available(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false
      }

      // 测试是否可以写入
      const testKey = '__ldesign_cache_test__'
      window.localStorage.setItem(testKey, 'test')
      window.localStorage.removeItem(testKey)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * 生成完整键名
   */
  private getFullKey(key: string): string {
    return `${this.keyPrefix}${key}`
  }

  /**
   * 从完整键名提取原始键名
   */
  private extractKey(fullKey: string): string {
    return fullKey.startsWith(this.keyPrefix)
      ? fullKey.slice(this.keyPrefix.length)
      : fullKey
  }

  /**
   * 设置缓存项
   */
  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.available) {
      throw new Error('localStorage is not available')
    }

    const fullKey = this.getFullKey(key)
    const data = this.createTTLData(value, ttl)
    const dataSize = this.calculateSize(fullKey) + this.calculateSize(data)

    // 检查存储空间
    if (!this.checkStorageSpace(dataSize)) {
      // 尝试清理过期项
      await this.cleanup()

      // 再次检查
      if (!this.checkStorageSpace(dataSize)) {
        throw new Error('Insufficient storage space in localStorage')
      }
    }

    try {
      window.localStorage.setItem(fullKey, data)
      await this.updateUsedSize()
    }
    catch (error) {
      if (
        error instanceof DOMException
        && error.name === 'QuotaExceededError'
      ) {
        throw new Error('localStorage quota exceeded')
      }
      throw error
    }
  }

  /**
   * 获取缓存项
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.available) {
      return null
    }

    const fullKey = this.getFullKey(key)

    try {
      const data = window.localStorage.getItem(fullKey)
      if (!data) {
        return null
      }

      const { value, expired } = this.parseTTLData(data)

      if (expired) {
        await this.removeItem(key)
        return null
      }

      return value
    }
    catch (error) {
      console.warn('Error getting item from localStorage:', error)
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

    const fullKey = this.getFullKey(key)
    window.localStorage.removeItem(fullKey)
    await this.updateUsedSize()
  }

  /**
   * 清空所有缓存项
   */
  async clear(): Promise<void> {
    if (!this.available) {
      return
    }

    const keys = await this.keys()
    for (const key of keys) {
      const fullKey = this.getFullKey(key)
      window.localStorage.removeItem(fullKey)
    }

    this._usedSize = 0
  }

  /**
   * 获取所有键名
   */
  async keys(): Promise<string[]> {
    if (!this.available) {
      return []
    }

    const keys: string[] = []

    for (let i = 0; i < window.localStorage.length; i++) {
      const fullKey = window.localStorage.key(i)
      if (fullKey && fullKey.startsWith(this.keyPrefix)) {
        keys.push(this.extractKey(fullKey))
      }
    }

    return keys
  }

  /**
   * 获取缓存项数量
   */
  async length(): Promise<number> {
    const keys = await this.keys()
    return keys.length
  }

  /**
   * 获取剩余存储空间
   */
  getRemainingSpace(): number {
    return Math.max(0, this.maxSize - this._usedSize)
  }

  /**
   * 获取存储使用率
   */
  getUsageRatio(): number {
    return this._usedSize / this.maxSize
  }

  /**
   * 批量设置缓存项（优化版本）
   * 
   * @param items - 要设置的键值对数组
   * @returns 设置结果数组
   */
  async batchSet(items: Array<{ key: string, value: string, ttl?: number }>): Promise<boolean[]> {
    if (!this.available) {
      return items.map(() => false)
    }

    const results: boolean[] = []

    // 批量写入，使用单次 usedSize 更新
    for (const { key, value, ttl } of items) {
      try {
        const fullKey = this.getFullKey(key)
        const data = this.createTTLData(value, ttl)

        window.localStorage.setItem(fullKey, data)
        results.push(true)
      }
      catch (error) {
        console.error(`Failed to set ${key}:`, error)
        results.push(false)
      }
    }

    // 批量操作后一次性更新大小
    await this.updateUsedSize()

    return results
  }

  /**
   * 批量获取缓存项（优化版本）
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

    for (const key of keys) {
      try {
        const fullKey = this.getFullKey(key)
        const data = window.localStorage.getItem(fullKey)

        if (!data) {
          results.push(null)
          continue
        }

        const { value, expired } = this.parseTTLData(data)

        if (expired) {
          expiredKeys.push(key)
          results.push(null)
          continue
        }

        results.push(value)
      }
      catch (error) {
        console.error(`Failed to get ${key}:`, error)
        results.push(null)
      }
    }

    // 批量删除过期项
    if (expiredKeys.length > 0) {
      await Promise.all(expiredKeys.map(key => this.removeItem(key)))
    }

    return results
  }

  /**
   * 批量删除缓存项（优化版本）
   * 
   * @param keys - 要删除的键数组
   * @returns 删除结果数组
   */
  async batchRemove(keys: string[]): Promise<boolean[]> {
    if (!this.available) {
      return keys.map(() => false)
    }

    const results: boolean[] = []

    for (const key of keys) {
      try {
        const fullKey = this.getFullKey(key)
        window.localStorage.removeItem(fullKey)
        results.push(true)
      }
      catch (error) {
        console.error(`Failed to remove ${key}:`, error)
        results.push(false)
      }
    }

    // 批量删除后一次性更新大小
    await this.updateUsedSize()

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

    return keys.map((key) => {
      const fullKey = this.getFullKey(key)
      return window.localStorage.getItem(fullKey) !== null
    })
  }
}
