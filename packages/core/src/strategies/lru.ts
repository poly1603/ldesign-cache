/**
 * LRU (Least Recently Used) 缓存策略实现
 * 
 * 使用双向链表 + Map 实现 O(1) 时间复杂度的读写操作
 * 
 * @module @ldesign/cache/core/strategies/lru
 */

import type { CacheItem } from '../types'

/**
 * 双向链表节点
 * @template T - 缓存值类型
 */
class ListNode<T = any> {
  key: string
  value: T
  prev: ListNode<T> | null = null
  next: ListNode<T> | null = null
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
 * LRU 缓存策略类
 * 
 * 特点：
 * - O(1) 时间复杂度的 get/set/delete 操作
 * - 自动淘汰最久未使用的项
 * - 支持 TTL 过期时间
 * - 内存占用最优
 * 
 * @template T - 缓存值类型
 * 
 * @example
 * ```typescript
 * const cache = new LRUCache<string>({ maxSize: 100 })
 * 
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2', 5000) // 5秒后过期
 * 
 * // 获取缓存
 * const value = cache.get('key1') // 'value1'
 * 
 * // 删除缓存
 * cache.delete('key1')
 * 
 * // 清空缓存
 * cache.clear()
 * ```
 */
export class LRUCache<T = any> {
  private cache: Map<string, ListNode<T>>
  private head: ListNode<T> | null = null
  private tail: ListNode<T> | null = null
  private maxSize: number
  private defaultTTL?: number

  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.cache = new Map()
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

    // 更新访问信息
    node.updateAccess()

    // 移动到链表头部（最近使用）
    this.moveToHead(node)

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

    // 如果键已存在，更新值并移到头部
    if (existingNode) {
      existingNode.value = value
      existingNode.lastAccessedAt = Date.now()
      const finalTTL = ttl ?? this.defaultTTL
      existingNode.ttl = finalTTL
      existingNode.expiresAt = finalTTL !== undefined ? Date.now() + finalTTL : undefined
      this.moveToHead(existingNode)
      return undefined
    }

    // 创建新节点
    const finalTTL = ttl ?? this.defaultTTL
    const newNode = new ListNode(key, value, finalTTL)

    // 添加到缓存和链表头部
    this.cache.set(key, newNode)
    this.addToHead(newNode)

    // 检查是否超过容量，需要淘汰
    let evicted: CacheItem<T> | undefined
    if (this.cache.size > this.maxSize) {
      const removed = this.removeTail()
      if (removed) {
        this.cache.delete(removed.key)
        evicted = removed.toCacheItem()
      }
    }

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

    this.removeNode(node)
    this.cache.delete(key)
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
    this.head = null
    this.tail = null
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

    for (const [key, node] of this.cache.entries()) {
      if (node.expiresAt !== undefined && now > node.expiresAt) {
        this.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * 移动节点到链表头部
   */
  private moveToHead(node: ListNode<T>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 添加节点到链表头部
   */
  private addToHead(node: ListNode<T>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * 从链表中移除节点
   */
  private removeNode(node: ListNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next
    }
    else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    }
    else {
      this.tail = node.prev
    }
  }

  /**
   * 移除链表尾部节点
   */
  private removeTail(): ListNode<T> | null {
    const node = this.tail
    if (node) {
      this.removeNode(node)
    }
    return node
  }
}

