/**
 * LRU Cache with TTL support
 * 
 * 高性能 LRU 缓存实现，支持：
 * - O(1) 的读写操作
 * - TTL 过期机制
 * - 内存使用监控
 * - 命中率统计
 */

/**
 * LRU 缓存节点
 */
class LRUNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public expiresAt?: number,
    public prev: LRUNode<K, V> | null = null,
    public next: LRUNode<K, V> | null = null,
  ) { }
}

/**
 * LRU 缓存选项
 */
export interface LRUCacheOptions {
  /** 最大缓存项数 */
  maxSize: number
  /** 默认 TTL（毫秒） */
  defaultTTL?: number
  /** 是否在 get 时自动清理过期项 */
  autoCleanup?: boolean
  /** 过期回调 */
  onEvict?: (key: any, value: any) => void
}

/**
 * LRU 缓存统计信息
 */
export interface LRUCacheStats {
  /** 总请求次数 */
  requests: number
  /** 命中次数 */
  hits: number
  /** 未命中次数 */
  misses: number
  /** 命中率 */
  hitRate: number
  /** 当前大小 */
  size: number
  /** 最大大小 */
  maxSize: number
  /** 淘汰次数 */
  evictions: number
}

/**
 * LRU 缓存实现
 */
export class LRUCache<K = string, V = any> {
  private cache: Map<K, LRUNode<K, V>> = new Map()
  private head: LRUNode<K, V> | null = null
  private tail: LRUNode<K, V> | null = null
  private readonly maxSize: number
  private readonly defaultTTL?: number
  private readonly autoCleanup: boolean
  private readonly onEvict?: (key: K, value: V) => void

  // 统计信息
  private stats = {
    requests: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
  }

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.maxSize
    this.defaultTTL = options.defaultTTL
    this.autoCleanup = options.autoCleanup ?? true
    this.onEvict = options.onEvict
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    this.stats.requests++

    const node = this.cache.get(key)
    if (!node) {
      this.stats.misses++
      return undefined
    }

    // 检查是否过期
    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.delete(key)
      this.stats.misses++
      return undefined
    }

    // 移到头部（最近使用）
    this.moveToHead(node)
    this.stats.hits++
    return node.value
  }

  /**
   * 设置缓存值
   */
  set(key: K, value: V, ttl?: number): void {
    // 检查是否已存在
    let node = this.cache.get(key)

    if (node) {
      // 更新现有节点
      node.value = value
      node.expiresAt = ttl ? Date.now() + ttl : this.defaultTTL ? Date.now() + this.defaultTTL : undefined
      this.moveToHead(node)
    }
    else {
      // 创建新节点
      const expiresAt = ttl ? Date.now() + ttl : this.defaultTTL ? Date.now() + this.defaultTTL : undefined
      node = new LRUNode(key, value, expiresAt)
      this.cache.set(key, node)
      this.addToHead(node)

      // 检查容量
      if (this.cache.size > this.maxSize) {
        this.removeTail()
      }
    }
  }

  /**
   * 删除缓存项
   */
  delete(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    this.removeNode(node)
    this.cache.delete(key)

    if (this.onEvict) {
      this.onEvict(key, node.value)
    }

    return true
  }

  /**
   * 检查键是否存在
   */
  has(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    // 检查是否过期
    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    // 触发所有淘汰回调
    if (this.onEvict) {
      for (const [key, node] of this.cache) {
        this.onEvict(key, node.value)
      }
    }

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
   * 清理过期项
   */
  cleanup(): number {
    const now = Date.now()
    const keysToDelete: K[] = []

    for (const [key, node] of this.cache) {
      if (node.expiresAt && now > node.expiresAt) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.delete(key)
    }

    return keysToDelete.length
  }

  /**
   * 获取统计信息
   */
  getStats(): LRUCacheStats {
    const hitRate = this.stats.requests > 0
      ? this.stats.hits / this.stats.requests
      : 0

    return {
      requests: this.stats.requests,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      size: this.cache.size,
      maxSize: this.maxSize,
      evictions: this.stats.evictions,
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      requests: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
    }
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(node => node.value)
  }

  /**
   * 迭代器支持
   */
  *entries(): IterableIterator<[K, V]> {
    for (const [key, node] of this.cache) {
      // 跳过过期项
      if (node.expiresAt && Date.now() > node.expiresAt) {
        continue
      }
      yield [key, node.value]
    }
  }

  /**
   * 将节点移到头部
   */
  private moveToHead(node: LRUNode<K, V>): void {
    if (node === this.head) {
      return
    }

    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 添加节点到头部
   */
  private addToHead(node: LRUNode<K, V>): void {
    node.next = this.head
    node.prev = null

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
  private removeNode(node: LRUNode<K, V>): void {
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
   * 移除尾部节点（最久未使用）
   */
  private removeTail(): void {
    if (!this.tail) {
      return
    }

    const key = this.tail.key
    const value = this.tail.value

    this.removeNode(this.tail)
    this.cache.delete(key)
    this.stats.evictions++

    if (this.onEvict) {
      this.onEvict(key, value)
    }
  }
}


