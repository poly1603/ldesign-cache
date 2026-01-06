/**
 * 缓存管理器 - 统一的缓存管理接口
 * 
 * 整合所有缓存策略，提供统一的 API
 * 
 * @module @ldesign/cache/core/cache-manager
 */

import type { BatchOptions, BatchResult, CacheEvent, CacheEventListener, CacheItem, CacheOptions, CacheStats, ICacheStrategy } from './types'
import { CacheEventType, CacheStrategy } from './types'
import { LRUCache } from './strategies/lru'
import { LFUCache } from './strategies/lfu'
import { FIFOCache } from './strategies/fifo'
import { TTLCache } from './strategies/ttl'

/**
 * 缓存管理器类
 * 
 * 特点：
 * - 支持多种缓存策略（LRU、LFU、FIFO、TTL）
 * - 统一的 API 接口
 * - 事件监听机制
 * - 缓存统计功能
 * - 批量操作支持
 * - 持久化支持（可选）
 * 
 * @template T - 缓存值类型
 * 
 * @example
 * ```typescript
 * // 创建 LRU 缓存
 * const cache = new CacheManager<string>({
 *   strategy: CacheStrategy.LRU,
 *   maxSize: 100,
 *   defaultTTL: 5000,
 *   enableStats: true
 * })
 * 
 * // 设置缓存
 * cache.set('key1', 'value1')
 * 
 * // 获取缓存
 * const value = cache.get('key1')
 * 
 * // 监听事件
 * cache.on('evict', (event) => {
 *   console.log('缓存项被淘汰:', event.key)
 * })
 * 
 * // 获取统计信息
 * const stats = cache.getStats()
 * console.log('命中率:', stats.hitRate)
 * ```
 */
export class CacheManager<T = any> {
  private strategy: ICacheStrategy<T>
  private options: Required<CacheOptions>
  private listeners: Map<CacheEventType, Set<CacheEventListener<T>>>
  private stats: CacheStats
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(options: CacheOptions = {}) {
    // 合并默认选项
    this.options = {
      strategy: CacheStrategy.LRU,
      maxSize: 100,
      defaultTTL: undefined,
      enableStats: true,
      enablePersistence: false,
      storageType: 'localStorage',
      storagePrefix: 'cache:',
      cleanupInterval: 60 * 1000, // 1 分钟
      ...options,
    } as Required<CacheOptions>

    // 初始化策略
    this.strategy = this.createStrategy(this.options.strategy)

    // 初始化事件监听器
    this.listeners = new Map()

    // 初始化统计信息
    this.stats = {
      size: 0,
      maxSize: this.options.maxSize,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      expirations: 0,
      memoryUsage: 0,
    }

    // 启动自动清理
    if (this.options.cleanupInterval > 0) {
      this.startAutoCleanup()
    }

    // 从持久化存储加载
    if (this.options.enablePersistence) {
      this.loadFromStorage()
    }
  }

  /**
   * 获取缓存项
   * @param key - 缓存键
   * @returns 缓存值，不存在或已过期返回 undefined
   */
  get(key: string): T | undefined {
    const value = this.strategy.get(key)

    // 更新统计
    if (this.options.enableStats) {
      this.stats.totalRequests++
      if (value !== undefined) {
        this.stats.hits++
        this.emit(CacheEventType.HIT, { key, value })
      }
      else {
        this.stats.misses++
        this.emit(CacheEventType.MISS, { key })
      }
      this.updateHitRate()
    }

    this.emit(CacheEventType.GET, { key, value })

    return value
  }

  /**
   * 设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），覆盖默认 TTL
   */
  set(key: string, value: T, ttl?: number): void {
    // 记录设置前的大小，用于检测是否发生淘汰
    const sizeBefore = this.strategy.size
    const wasAtCapacity = sizeBefore >= this.options.maxSize

    this.strategy.set(key, value, ttl)

    // 如果之前已满且没有增加大小，说明发生了淘汰
    if (wasAtCapacity && this.strategy.size <= sizeBefore) {
      if (this.options.enableStats) {
        this.stats.evictions++
      }
      // 无法获取具体淘汰的项，只发送通知
      this.emit(CacheEventType.EVICT, { key: '', value: undefined as unknown as T })
    }

    // 更新统计
    if (this.options.enableStats) {
      this.stats.size = this.strategy.size
      this.updateMemoryUsage()
    }

    this.emit(CacheEventType.SET, { key, value })

    // 持久化
    if (this.options.enablePersistence) {
      this.saveToStorage(key, value)
    }
  }

  /**
   * 删除缓存项
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    const success = this.strategy.delete(key)

    if (success) {
      // 更新统计
      if (this.options.enableStats) {
        this.stats.size = this.strategy.size
        this.updateMemoryUsage()
      }

      this.emit(CacheEventType.DELETE, { key })

      // 从持久化存储删除
      if (this.options.enablePersistence) {
        this.removeFromStorage(key)
      }
    }

    return success
  }

  /**
   * 检查缓存项是否存在
   * @param key - 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    return this.strategy.has(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.strategy.clear()

    // 重置统计
    if (this.options.enableStats) {
      this.stats.size = 0
      this.stats.memoryUsage = 0
    }

    this.emit(CacheEventType.CLEAR, {})

    // 清空持久化存储
    if (this.options.enablePersistence) {
      this.clearStorage()
    }
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.strategy.size
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return this.strategy.keys()
  }

  /**
   * 获取所有值
   */
  values(): T[] {
    return this.strategy.values()
  }

  /**
   * 获取所有缓存项
   */
  entries(): Array<[string, T]> {
    return this.strategy.entries()
  }

  /**
   * 获取缓存项详情
   * @param key - 缓存键
   * @returns 缓存项详情，不存在返回 undefined
   */
  getItem(key: string): CacheItem<T> | undefined {
    return this.strategy.getItem(key)
  }

  /**
   * 批量获取缓存项
   * @param keys - 缓存键数组
   * @returns 键值对 Map
   */
  mget(keys: string[]): Map<string, T> {
    const result = new Map<string, T>()

    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result.set(key, value)
      }
    }

    return result
  }

  /**
   * 批量设置缓存项
   * @param entries - 键值对数组
   * @param options - 批量操作选项
   * @returns 批量操作结果
   */
  mset(entries: Array<[string, T]>, options: BatchOptions = {}): BatchResult<void> {
    const { continueOnError = true, ttl } = options
    const succeeded: string[] = []
    const failed: Array<{ key: string, error: Error }> = []

    for (const [key, value] of entries) {
      try {
        this.set(key, value, ttl)
        succeeded.push(key)
      }
      catch (error) {
        failed.push({ key, error: error as Error })
        if (!continueOnError) {
          break
        }
      }
    }

    return {
      succeeded,
      failed,
      results: new Map(),
      duration: 0,
      get allSucceeded() { return failed.length === 0 },
    }
  }

  /**
   * 批量删除缓存项
   * @param keys - 缓存键数组
   * @param options - 批量操作选项
   * @returns 批量操作结果
   */
  mdel(keys: string[], options: BatchOptions = {}): BatchResult<boolean> {
    const { continueOnError = true } = options
    const succeeded: string[] = []
    const failed: Array<{ key: string, error: Error }> = []
    const results = new Map<string, boolean>()

    for (const key of keys) {
      try {
        const success = this.delete(key)
        results.set(key, success)
        if (success) {
          succeeded.push(key)
        }
      }
      catch (error) {
        failed.push({ key, error: error as Error })
        if (!continueOnError) {
          break
        }
      }
    }

    return {
      succeeded,
      failed,
      results,
      duration: 0,
      get allSucceeded() { return failed.length === 0 },
    }
  }

  /**
   * 获取统计信息
   * @returns 缓存统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      size: this.strategy.size,
      maxSize: this.options.maxSize,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      expirations: 0,
      memoryUsage: this.stats.memoryUsage,
    }
  }

  /**
   * 清理过期项
   * @returns 清理的项数
   */
  cleanup(): number {
    const count = this.strategy.cleanup()

    if (count > 0 && this.options.enableStats) {
      this.stats.expirations += count
      this.stats.size = this.strategy.size
      this.updateMemoryUsage()
    }

    return count
  }

  /**
   * 监听缓存事件
   * @param type - 事件类型
   * @param listener - 事件监听器
   */
  on(type: CacheEventType, listener: CacheEventListener<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  /**
   * 移除事件监听器
   * @param type - 事件类型
   * @param listener - 事件监听器
   */
  off(type: CacheEventType, listener: CacheEventListener<T>): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   * @param type - 事件类型
   * @param data - 事件数据
   */
  private emit(type: CacheEventType, data: Partial<CacheEvent<T>>): void {
    const listeners = this.listeners.get(type)
    if (!listeners || listeners.size === 0) {
      return
    }

    const event: CacheEvent<T> = {
      type,
      timestamp: Date.now(),
      ...data,
    }

    for (const listener of listeners) {
      try {
        listener(event)
      }
      catch (error) {
        console.error('缓存事件监听器错误:', error)
      }
    }
  }

  /**
   * 创建缓存策略实例
   */
  private createStrategy(strategy: CacheStrategy): ICacheStrategy<T> {
    const { maxSize, defaultTTL, cleanupInterval } = this.options

    switch (strategy) {
      case CacheStrategy.LRU:
        return new LRUCache<T>(maxSize, defaultTTL)
      case CacheStrategy.LFU:
        return new LFUCache<T>(maxSize, defaultTTL)
      case CacheStrategy.FIFO:
        return new FIFOCache<T>(maxSize, defaultTTL)
      case CacheStrategy.TTL:
        return new TTLCache<T>(defaultTTL ?? 5 * 60 * 1000, cleanupInterval)
      default:
        return new LRUCache<T>(maxSize, defaultTTL)
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    if (this.stats.totalRequests > 0) {
      this.stats.hitRate = this.stats.hits / this.stats.totalRequests
    }
  }

  /**
   * 更新内存占用估算
   */
  private updateMemoryUsage(): void {
    // 简单估算：每个缓存项约 100 字节
    this.stats.memoryUsage = this.strategy.size * 100
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.options.cleanupInterval)

    // 在 Node.js 环境中，允许进程退出
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref()
    }
  }

  /**
   * 停止自动清理定时器
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  /**
   * 从持久化存储加载
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = this.getStorage()
      if (!storage) {
        return
      }

      const prefix = this.options.storagePrefix
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key && key.startsWith(prefix)) {
          const cacheKey = key.slice(prefix.length)
          const data = storage.getItem(key)
          if (data) {
            const item = JSON.parse(data) as CacheItem<T>
            // 检查是否过期
            if (!item.expiresAt || Date.now() < item.expiresAt) {
              this.strategy.set(cacheKey, item.value, item.ttl)
            }
          }
        }
      }
    }
    catch (error) {
      console.error('从存储加载缓存失败:', error)
    }
  }

  /**
   * 保存到持久化存储
   */
  private saveToStorage(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = this.getStorage()
      if (!storage) {
        return
      }

      const item = this.strategy.getItem(key)
      if (item) {
        const storageKey = this.options.storagePrefix + key
        storage.setItem(storageKey, JSON.stringify(item))
      }
    }
    catch (error) {
      console.error('保存缓存到存储失败:', error)
    }
  }

  /**
   * 从持久化存储删除
   */
  private removeFromStorage(key: string): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = this.getStorage()
      if (!storage) {
        return
      }

      const storageKey = this.options.storagePrefix + key
      storage.removeItem(storageKey)
    }
    catch (error) {
      console.error('从存储删除缓存失败:', error)
    }
  }

  /**
   * 清空持久化存储
   */
  private clearStorage(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const storage = this.getStorage()
      if (!storage) {
        return
      }

      const prefix = this.options.storagePrefix
      const keysToRemove: string[] = []

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key)
        }
      }

      for (const key of keysToRemove) {
        storage.removeItem(key)
      }
    }
    catch (error) {
      console.error('清空存储缓存失败:', error)
    }
  }

  /**
   * 获取存储对象
   */
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null
    }

    return this.options.storageType === 'localStorage'
      ? window.localStorage
      : window.sessionStorage
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    this.stopAutoCleanup()
    this.clear()
    this.listeners.clear()
  }
}

/**
 * 创建缓存管理器实例
 * @param options - 缓存配置选项
 * @returns 缓存管理器实例
 */
export function createCacheManager<T = any>(options?: CacheOptions): CacheManager<T> {
  return new CacheManager<T>(options)
}


