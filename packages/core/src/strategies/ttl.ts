/**
 * TTL (Time To Live) 缓存策略实现
 * 
 * 基于过期时间的缓存策略，自动清理过期项
 * 
 * @module @ldesign/cache/core/strategies/ttl
 */

import type { CacheItem } from '../types'

/**
 * TTL 缓存节点
 * @template T - 缓存值类型
 */
class TTLNode<T = any> {
  key: string
  value: T
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt: number
  ttl: number

  constructor(key: string, value: T, ttl: number) {
    this.key = key
    this.value = value
    this.createdAt = Date.now()
    this.lastAccessedAt = this.createdAt
    this.accessCount = 0
    this.ttl = ttl
    this.expiresAt = this.createdAt + ttl
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
    return Date.now() > this.expiresAt
  }

  /**
   * 更新访问信息
   */
  updateAccess(): void {
    this.lastAccessedAt = Date.now()
    this.accessCount++
  }

  /**
   * 刷新过期时间
   */
  refresh(): void {
    this.expiresAt = Date.now() + this.ttl
  }
}

/**
 * TTL 缓存策略类
 * 
 * 特点：
 * - 所有项都必须设置 TTL
 * - 自动清理过期项
 * - 支持定时清理和惰性清理
 * - O(1) 时间复杂度的 get/set/delete 操作
 * - 适合需要严格过期控制的场景
 * 
 * @template T - 缓存值类型
 * 
 * @example
 * ```typescript
 * const cache = new TTLCache<string>({
 *   defaultTTL: 5000, // 默认 5 秒过期
 *   cleanupInterval: 1000 // 每秒清理一次
 * })
 * 
 * // 设置缓存（使用默认 TTL）
 * cache.set('key1', 'value1')
 * 
 * // 设置缓存（自定义 TTL）
 * cache.set('key2', 'value2', 10000) // 10 秒后过期
 * 
 * // 5 秒后 key1 自动过期
 * setTimeout(() => {
 *   console.log(cache.get('key1')) // undefined
 * }, 5000)
 * ```
 */
export class TTLCache<T = any> {
  private cache: Map<string, TTLNode<T>>
  private defaultTTL: number
  private cleanupInterval: number
  private cleanupTimer?: ReturnType<typeof setInterval>

  constructor(defaultTTL: number = 5 * 60 * 1000, cleanupInterval: number = 60 * 1000) {
    this.cache = new Map()
    this.defaultTTL = defaultTTL
    this.cleanupInterval = cleanupInterval

    // 启动自动清理
    if (cleanupInterval > 0) {
      this.startAutoCleanup()
    }
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

    // 检查是否过期（惰性清理）
    if (node.isExpired()) {
      this.delete(key)
      return undefined
    }

    // 更新访问信息
    node.updateAccess()

    return node.value
  }

  /**
   * 设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），覆盖默认 TTL
   */
  set(key: string, value: T, ttl?: number): void {
    const finalTTL = ttl ?? this.defaultTTL
    const existingNode = this.cache.get(key)

    // 如果键已存在，更新值和过期时间
    if (existingNode) {
      existingNode.value = value
      existingNode.ttl = finalTTL
      existingNode.refresh()
      existingNode.lastAccessedAt = Date.now()
      return
    }

    // 创建新节点
    const newNode = new TTLNode(key, value, finalTTL)
    this.cache.set(key, newNode)
  }

  /**
   * 删除缓存项
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
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
   * 刷新缓存项的过期时间
   * @param key - 缓存键
   * @param ttl - 新的 TTL（可选，默认使用原 TTL）
   * @returns 是否刷新成功
   */
  refresh(key: string, ttl?: number): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    if (node.isExpired()) {
      this.delete(key)
      return false
    }

    if (ttl !== undefined) {
      node.ttl = ttl
    }

    node.refresh()
    return true
  }

  /**
   * 获取缓存项的剩余 TTL
   * @param key - 缓存键
   * @returns 剩余 TTL（毫秒），不存在或已过期返回 -1
   */
  getRemainingTTL(key: string): number {
    const node = this.cache.get(key)
    if (!node) {
      return -1
    }

    if (node.isExpired()) {
      this.delete(key)
      return -1
    }

    return Math.max(0, node.expiresAt - Date.now())
  }

  /**
   * 清理所有过期项
   * @returns 清理的项数
   */
  cleanup(): number {
    let count = 0
    const now = Date.now()

    for (const [key, node] of this.cache.entries()) {
      if (now > node.expiresAt) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)

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
   * 销毁缓存实例
   */
  destroy(): void {
    this.stopAutoCleanup()
    this.clear()
  }
}

