/**
 * FIFO (First In First Out) 缓存策略实现
 * 
 * 使用队列实现，先进先出，最简单的淘汰策略
 * 
 * @module @ldesign/cache/core/strategies/fifo
 */

import type { CacheItem } from '../types'

/**
 * FIFO 缓存节点
 * @template T - 缓存值类型
 */
class FIFONode<T = any> {
  key: string
  value: T
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt?: number
  ttl?: number

  constructor(key: string, value: T, ttl?: number) {
    this.key = key
    this.value = value
    this.createdAt = Date.now()
    this.lastAccessedAt = this.createdAt
    this.accessCount = 0
    this.ttl = ttl
    if (ttl !== undefined) {
      this.expiresAt = this.createdAt + ttl
    }
  }

  /**
   * 转换为 CacheItem 格式
   */
  toCacheItem(): CacheItem<T> {
    return {
      key: this.key,
      value: this.value,
      createdAt: this.createdAt,
      lastAccessedAt: this.lastAccessedAt,
      accessCount: this.accessCount,
      expiresAt: this.expiresAt,
      ttl: this.ttl,
    }
  }

  /**
   * 检查是否过期
   */
  isExpired(): boolean {
    return this.expiresAt !== undefined && Date.now() > this.expiresAt
  }

  /**
   * 更新访问信息
   */
  updateAccess(): void {
    this.lastAccessedAt = Date.now()
    this.accessCount++
  }
}

/**
 * FIFO 缓存策略类
 * 
 * 特点：
 * - 先进先出，最简单的淘汰策略
 * - O(1) 时间复杂度的所有操作
 * - 不考虑访问频率和时间
 * - 支持 TTL 过期时间
 * - 内存占用最小
 * 
 * @template T - 缓存值类型
 * 
 * @example
 * ```typescript
 * const cache = new FIFOCache<string>(100)
 * 
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2')
 * cache.set('key3', 'value3')
 * 
 * // 当容量满时，key1 会被最先淘汰（最早添加）
 * ```
 */
export class FIFOCache<T = any> {
  private cache: Map<string, FIFONode<T>>
  private queue: string[]
  private maxSize: number
  private defaultTTL?: number

  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.cache = new Map()
    this.queue = []
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  /**
   * 获取缓存项
   * @param key - 缓存键
   * @returns 缓存值，不存在或已过期返回 undefined
   */
  get(key: string): T | undefined {
    const node = this.cache.get(key)
    if (!node) {
      return undefined
    }

    // 检查是否过期
    if (node.isExpired()) {
      this.delete(key)
      return undefined
    }

    // 更新访问信息（但不改变队列顺序）
    node.updateAccess()

    return node.value
  }

  /**
   * 设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），覆盖默认 TTL
   * @returns 被淘汰的项（如果有）
   */
  set(key: string, value: T, ttl?: number): CacheItem<T> | undefined {
    const existingNode = this.cache.get(key)

    // 如果键已存在，只更新值，不改变队列位置
    if (existingNode) {
      existingNode.value = value
      existingNode.lastAccessedAt = Date.now()
      const finalTTL = ttl ?? this.defaultTTL
      existingNode.ttl = finalTTL
      existingNode.expiresAt = finalTTL !== undefined ? Date.now() + finalTTL : undefined
      return undefined
    }

    // 检查是否需要淘汰
    let evicted: CacheItem<T> | undefined
    if (this.cache.size >= this.maxSize) {
      evicted = this.evict()
    }

    // 创建新节点
    const finalTTL = ttl ?? this.defaultTTL
    const newNode = new FIFONode(key, value, finalTTL)

    // 添加到缓存和队列
    this.cache.set(key, newNode)
    this.queue.push(key)

    return evicted
  }

  /**
   * 删除缓存项
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    // 从缓存中移除
    this.cache.delete(key)

    // 从队列中移除
    const index = this.queue.indexOf(key)
    if (index > -1) {
      this.queue.splice(index, 1)
    }

    return true
  }

  /**
   * 检查缓存项是否存在
   * @param key - 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    if (node.isExpired()) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.queue = []
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(node => node.value)
  }

  /**
   * 获取所有缓存项
   */
  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([key, node]) => [key, node.value])
  }

  /**
   * 获取缓存项详情
   * @param key - 缓存键
   * @returns 缓存项详情，不存在返回 undefined
   */
  getItem(key: string): CacheItem<T> | undefined {
    const node = this.cache.get(key)
    if (!node) {
      return undefined
    }

    if (node.isExpired()) {
      this.delete(key)
      return undefined
    }

    return node.toCacheItem()
  }

  /**
   * 清理所有过期项
   * @returns 清理的项数
   */
  cleanup(): number {
    let count = 0
    const now = Date.now()

    // 使用副本遍历，避免在遍历时修改
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      const node = this.cache.get(key)
      if (node && node.expiresAt !== undefined && now > node.expiresAt) {
        this.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 淘汰最早添加的项（队列头部）
   * @returns 被淘汰的项
   */
  private evict(): CacheItem<T> | undefined {
    if (this.queue.length === 0) {
      return undefined
    }

    // 获取队列头部的键（最早添加的）
    const keyToEvict = this.queue.shift()
    if (!keyToEvict) {
      return undefined
    }

    const node = this.cache.get(keyToEvict)
    if (node) {
      this.cache.delete(keyToEvict)
      return node.toCacheItem()
    }

    return undefined
  }
}

