/**
 * LFU (Least Frequently Used) 缓存策略实现
 * 
 * 使用最小堆 + Map 实现高效的频率管理
 * 
 * @module @ldesign/cache/core/strategies/lfu
 */

import type { CacheItem } from '../types'

/**
 * LFU 缓存节点
 * @template T - 缓存值类型
 */
class LFUNode<T = any> {
  key: string
  value: T
  frequency: number
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt?: number
  ttl?: number

  constructor(key: string, value: T, ttl?: number) {
    this.key = key
    this.value = value
    this.frequency = 1
    this.createdAt = Date.now()
    this.lastAccessedAt = this.createdAt
    this.accessCount = 1
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
   * 增加访问频率
   */
  incrementFrequency(): void {
    this.frequency++
    this.accessCount++
    this.lastAccessedAt = Date.now()
  }
}

/**
 * LFU 缓存策略类
 * 
 * 特点：
 * - 淘汰访问频率最低的项
 * - 相同频率时淘汰最早访问的项
 * - 支持 TTL 过期时间
 * - O(1) 时间复杂度的 get 操作
 * - O(log n) 时间复杂度的 set 操作
 * 
 * @template T - 缓存值类型
 * 
 * @example
 * ```typescript
 * const cache = new LFUCache<string>(100)
 * 
 * // 设置缓存
 * cache.set('key1', 'value1')
 * cache.set('key2', 'value2', 5000) // 5秒后过期
 * 
 * // 获取缓存（增加访问频率）
 * cache.get('key1') // 频率 +1
 * cache.get('key1') // 频率 +1
 * 
 * // key2 频率较低，会被优先淘汰
 * ```
 */
export class LFUCache<T = any> {
  private cache: Map<string, LFUNode<T>>
  private frequencyMap: Map<number, Set<string>>
  private minFrequency: number
  private maxSize: number
  private defaultTTL?: number

  constructor(maxSize: number = 100, defaultTTL?: number) {
    this.cache = new Map()
    this.frequencyMap = new Map()
    this.minFrequency = 0
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

    // 更新频率
    this.updateFrequency(node)

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

    // 如果键已存在，更新值和频率
    if (existingNode) {
      existingNode.value = value
      const finalTTL = ttl ?? this.defaultTTL
      existingNode.ttl = finalTTL
      existingNode.expiresAt = finalTTL !== undefined ? Date.now() + finalTTL : undefined
      this.updateFrequency(existingNode)
      return undefined
    }

    // 检查是否需要淘汰
    let evicted: CacheItem<T> | undefined
    if (this.cache.size >= this.maxSize) {
      evicted = this.evict()
    }

    // 创建新节点
    const finalTTL = ttl ?? this.defaultTTL
    const newNode = new LFUNode(key, value, finalTTL)

    // 添加到缓存
    this.cache.set(key, newNode)

    // 添加到频率映射
    this.addToFrequencyMap(newNode)

    // 重置最小频率为 1
    this.minFrequency = 1

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

    // 从频率映射中移除
    this.removeFromFrequencyMap(node)

    // 从缓存中移除
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
    this.frequencyMap.clear()
    this.minFrequency = 0
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
   * 更新节点频率
   */
  private updateFrequency(node: LFUNode<T>): void {
    const oldFreq = node.frequency

    // 从旧频率集合中移除
    this.removeFromFrequencyMap(node)

    // 增加频率
    node.incrementFrequency()

    // 添加到新频率集合
    this.addToFrequencyMap(node)

    // 如果旧频率是最小频率且该频率集合为空，更新最小频率
    if (oldFreq === this.minFrequency) {
      const freqSet = this.frequencyMap.get(oldFreq)
      if (!freqSet || freqSet.size === 0) {
        this.minFrequency = oldFreq + 1
      }
    }
  }

  /**
   * 添加节点到频率映射
   */
  private addToFrequencyMap(node: LFUNode<T>): void {
    const freq = node.frequency
    if (!this.frequencyMap.has(freq)) {
      this.frequencyMap.set(freq, new Set())
    }
    this.frequencyMap.get(freq)!.add(node.key)
  }

  /**
   * 从频率映射中移除节点
   */
  private removeFromFrequencyMap(node: LFUNode<T>): void {
    const freq = node.frequency
    const freqSet = this.frequencyMap.get(freq)
    if (freqSet) {
      freqSet.delete(node.key)
      if (freqSet.size === 0) {
        this.frequencyMap.delete(freq)
      }
    }
  }

  /**
   * 淘汰最低频率的项
   * @returns 被淘汰的项
   */
  private evict(): CacheItem<T> | undefined {
    // 获取最小频率的键集合
    const minFreqSet = this.frequencyMap.get(this.minFrequency)
    if (!minFreqSet || minFreqSet.size === 0) {
      return undefined
    }

    // 获取第一个键（最早添加的）
    const keyToEvict = minFreqSet.values().next().value as string | undefined
    if (!keyToEvict) {
      return undefined
    }

    const node = this.cache.get(keyToEvict)

    if (node) {
      this.delete(keyToEvict)
      return node.toCacheItem()
    }

    return undefined
  }
}

