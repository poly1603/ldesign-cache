/**
 * 弱引用缓存 - 基于 WeakMap 和 WeakRef 的内存友好缓存
 * 
 * 特性：
 * 1. 自动垃圾回收
 * 2. 零内存泄漏风险
 * 3. 适合缓存大对象
 * 4. 支持 TTL
 * 5. 支持 FinalizationRegistry 清理
 */

export interface WeakCacheOptions {
  /** 默认 TTL（毫秒） */
  defaultTTL?: number
  /** 是否启用 FinalizationRegistry */
  enableFinalization?: boolean
  /** 清理回调 */
  onCleanup?: (key: string) => void
}

interface WeakCacheEntry<T> {
  ref: WeakRef<T>
  expiresAt?: number
  metadata?: any
}

/**
 * 弱引用缓存实现
 * 
 * 使用 WeakMap 和 WeakRef 实现的内存友好缓存，
 * 适用于缓存大对象，支持自动垃圾回收
 * 
 * @example
 * ```typescript
 * const cache = new WeakCache<LargeObject>()
 * 
 * const obj = new LargeObject()
 * cache.set('key', obj)
 * 
 * // 当 obj 不再被引用时，会自动从缓存中移除
 * ```
 */
export class WeakCache<T extends object = object> {
  // 字符串键到对象的映射
  private keyToObject = new Map<string, WeakRef<object>>()
  // 对象到缓存项的弱映射
  private cache = new WeakMap<object, WeakCacheEntry<T>>()
  // TTL 定时器
  private timers = new Map<string, number>()
  // FinalizationRegistry 用于清理
  private registry?: FinalizationRegistry<string>

  private options: Required<WeakCacheOptions>

  constructor(options: WeakCacheOptions = {}) {
    this.options = {
      defaultTTL: options.defaultTTL || 0,
      enableFinalization: options.enableFinalization ?? true,
      onCleanup: options.onCleanup || (() => { }),
    }

    // 设置 FinalizationRegistry
    if (this.options.enableFinalization && typeof FinalizationRegistry !== 'undefined') {
      this.registry = new FinalizationRegistry((key: string) => {
        this.cleanup(key)
      })
    }
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    // 清理旧的定时器
    this.clearTimer(key)

    // 创建键对象（用于 WeakMap）
    const keyObj = {}
    const valueRef = new WeakRef(value)

    // 存储引用
    this.keyToObject.set(key, new WeakRef(keyObj))

    // 创建缓存条目
    const entry: WeakCacheEntry<T> = {
      ref: valueRef,
      expiresAt: ttl || this.options.defaultTTL
        ? Date.now() + (ttl || this.options.defaultTTL)
        : undefined,
    }

    this.cache.set(keyObj, entry)

    // 注册清理
    if (this.registry) {
      this.registry.register(value, key, value)
    }

    // 设置 TTL 定时器
    if (entry.expiresAt) {
      const timeout = entry.expiresAt - Date.now()
      if (timeout > 0) {
        const timer = setTimeout(() => {
          this.delete(key)
        }, timeout) as unknown as number

        this.timers.set(key, timer)
      }
    }
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | undefined {
    const keyRef = this.keyToObject.get(key)
    if (!keyRef) return undefined

    const keyObj = keyRef.deref()
    if (!keyObj) {
      // 键对象已被回收
      this.cleanup(key)
      return undefined
    }

    const entry = this.cache.get(keyObj)
    if (!entry) return undefined

    // 检查过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return undefined
    }

    // 获取值
    const value = entry.ref.deref()
    if (!value) {
      // 值已被回收
      this.cleanup(key)
      return undefined
    }

    return value
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    const value = this.get(key)
    return value !== undefined
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const keyRef = this.keyToObject.get(key)
    if (!keyRef) return false

    const keyObj = keyRef.deref()
    if (keyObj) {
      const entry = this.cache.get(keyObj)
      if (entry) {
        const value = entry.ref.deref()
        if (value && this.registry) {
          this.registry.unregister(value)
        }
      }
      this.cache.delete(keyObj)
    }

    this.keyToObject.delete(key)
    this.clearTimer(key)

    return true
  }

  /**
   * 清理已回收的条目
   */
  private cleanup(key: string): void {
    this.keyToObject.delete(key)
    this.clearTimer(key)
    this.options.onCleanup(key)
  }

  /**
   * 清理定时器
   */
  private clearTimer(key: string): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  /**
   * 获取当前大小（仅活跃项）
   */
  get size(): number {
    let count = 0

    for (const [key] of this.keyToObject) {
      if (this.has(key)) {
        count++
      }
    }

    return count
  }

  /**
   * 清空缓存
   */
  clear(): void {
    // 清理所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }

    // 取消所有注册
    if (this.registry) {
      for (const [key] of this.keyToObject) {
        const value = this.get(key)
        if (value) {
          this.registry.unregister(value)
        }
      }
    }

    this.keyToObject.clear()
    this.timers.clear()
    // WeakMap 会自动清理
  }

  /**
   * 手动触发垃圾回收检查
   */
  gc(): void {
    const keysToDelete: string[] = []

    for (const [key, keyRef] of this.keyToObject) {
      const keyObj = keyRef.deref()
      if (!keyObj) {
        keysToDelete.push(key)
        continue
      }

      const entry = this.cache.get(keyObj)
      if (!entry || !entry.ref.deref()) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cleanup(key)
    }
  }
}

/**
 * 创建带有大小限制的弱引用缓存
 */
export class SizedWeakCache<T extends object = object> extends WeakCache<T> {
  private accessOrder: string[] = []
  private maxSize: number

  constructor(maxSize: number, options?: WeakCacheOptions) {
    super(options)
    this.maxSize = maxSize
  }

  set(key: string, value: T, ttl?: number): void {
    // 更新访问顺序
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)

    // 检查大小限制
    while (this.accessOrder.length > this.maxSize) {
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.delete(oldestKey)
      }
    }

    super.set(key, value, ttl)
  }

  get(key: string): T | undefined {
    const value = super.get(key)

    if (value !== undefined) {
      // 更新访问顺序（LRU）
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
        this.accessOrder.push(key)
      }
    }

    return value
  }

  delete(key: string): boolean {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }

    return super.delete(key)
  }

  clear(): void {
    this.accessOrder = []
    super.clear()
  }
}

/**
 * 创建分层缓存（强引用 + 弱引用）
 */
export class TieredCache<T extends object = object> {
  private hotCache: Map<string, T>
  private warmCache: WeakCache<T>
  private maxHotSize: number
  private accessCount = new Map<string, number>()
  private promotionThreshold: number

  constructor(options: {
    maxHotSize?: number
    promotionThreshold?: number
    weakCacheOptions?: WeakCacheOptions
  } = {}) {
    this.maxHotSize = options.maxHotSize || 100
    this.promotionThreshold = options.promotionThreshold || 3
    this.hotCache = new Map()
    this.warmCache = new WeakCache(options.weakCacheOptions)
  }

  set(key: string, value: T, ttl?: number): void {
    // 重置访问计数
    this.accessCount.set(key, 0)

    // 先放入 warm cache
    this.warmCache.set(key, value, ttl)
  }

  get(key: string): T | undefined {
    // 先检查 hot cache
    let value = this.hotCache.get(key)
    if (value) {
      return value
    }

    // 检查 warm cache
    value = this.warmCache.get(key)
    if (value) {
      // 增加访问计数
      const count = (this.accessCount.get(key) || 0) + 1
      this.accessCount.set(key, count)

      // 检查是否需要提升
      if (count >= this.promotionThreshold) {
        this.promote(key, value)
      }

      return value
    }

    return undefined
  }

  private promote(key: string, value: T): void {
    // 检查 hot cache 大小
    if (this.hotCache.size >= this.maxHotSize) {
      // 找出最少访问的项并降级
      let minKey = ''
      let minCount = Infinity

      for (const [k, v] of this.hotCache) {
        const count = this.accessCount.get(k) || 0
        if (count < minCount) {
          minCount = count
          minKey = k
        }
      }

      if (minKey) {
        const demoteValue = this.hotCache.get(minKey)
        if (demoteValue) {
          this.hotCache.delete(minKey)
          this.warmCache.set(minKey, demoteValue)
        }
      }
    }

    // 提升到 hot cache
    this.hotCache.set(key, value)
  }

  has(key: string): boolean {
    return this.hotCache.has(key) || this.warmCache.has(key)
  }

  delete(key: string): boolean {
    const hotDeleted = this.hotCache.delete(key)
    const warmDeleted = this.warmCache.delete(key)
    this.accessCount.delete(key)

    return hotDeleted || warmDeleted
  }

  clear(): void {
    this.hotCache.clear()
    this.warmCache.clear()
    this.accessCount.clear()
  }

  getStats() {
    return {
      hotSize: this.hotCache.size,
      warmSize: this.warmCache.size,
      totalAccessCounts: Array.from(this.accessCount.values()).reduce((a, b) => a + b, 0),
    }
  }
}


