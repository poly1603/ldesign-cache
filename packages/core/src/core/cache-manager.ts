/**
 * 缓存管理器核心实现
 *
 * 提供统一的缓存操作接口，支持多种存储引擎
 * 基于高性能的 MemoryEngine 实现，支持 LRU/LFU 等多种淘汰策略
 *
 * @module cache-manager
 */
import type { CacheOptions, CacheStats, SerializableValue, SetOptions, StorageEngine } from '../types'
import { MemoryEngine } from '../engines/memory-engine'

/**
 * 缓存管理器
 *
 * 提供高性能的缓存管理功能，基于 MemoryEngine 实现
 *
 * 特性：
 * - 支持多种淘汰策略（LRU、LFU、FIFO、MRU、Random、TTL、ARC）
 * - 自动内存管理和过期清理
 * - 对象池优化，减少 GC 压力
 * - 批量操作支持
 *
 * @example
 * ```typescript
 * const cache = new CacheManager({
 *   defaultEngine: 'memory',
 *   defaultTTL: 60 * 1000, // 1分钟
 *   engines: {
 *     memory: {
 *       maxSize: 50 * 1024 * 1024, // 50MB
 *       maxItems: 5000,
 *       evictionStrategy: 'LRU'
 *     }
 *   }
 * })
 *
 * await cache.set('user', { name: '张三' })
 * const user = await cache.get<User>('user')
 * ```
 */
export class CacheManager {
  /** 缓存配置选项 */
  private readonly options: Required<Pick<CacheOptions, 'defaultEngine' | 'defaultTTL'>> & CacheOptions

  /** 内存存储引擎 */
  private readonly engine: MemoryEngine

  /** 命中计数 */
  private hits = 0

  /** 未命中计数 */
  private misses = 0

  /**
   * 创建缓存管理器实例
   *
   * @param options - 缓存配置选项
   *
   * @example
   * ```typescript
   * // 使用默认配置
   * const cache = new CacheManager()
   *
   * // 自定义配置
   * const cache = new CacheManager({
   *   defaultTTL: 5 * 60 * 1000, // 5分钟
   *   engines: {
   *     memory: {
   *       maxItems: 10000,
   *       evictionStrategy: 'LFU'
   *     }
   *   }
   * })
   * ```
   */
  constructor(options: CacheOptions = {}) {
    this.options = {
      defaultEngine: 'memory',
      defaultTTL: 60 * 60 * 1000, // 默认 1 小时
      ...options,
    }

    // 创建内存引擎实例
    this.engine = new MemoryEngine(this.options.engines?.memory)
  }

  /**
   * 获取缓存值
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @returns 缓存值，如果不存在或已过期则返回 null
   *
   * @example
   * ```typescript
   * const user = await cache.get<User>('user')
   * if (user) {
   *   console.log(user.name)
   * }
   * ```
   */
  async get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null> {
    const rawValue = await this.engine.getItem(key)

    if (rawValue === null) {
      this.misses++
      return null
    }

    this.hits++

    try {
      return JSON.parse(rawValue) as T
    }
    catch {
      // 如果解析失败，尝试直接返回字符串值
      return rawValue as unknown as T
    }
  }

  /**
   * 设置缓存值
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   *
   * @example
   * ```typescript
   * // 使用默认 TTL
   * await cache.set('user', { name: '张三' })
   *
   * // 自定义 TTL
   * await cache.set('session', sessionData, { ttl: 30 * 60 * 1000 })
   *
   * // 永不过期
   * await cache.set('config', configData, { ttl: 0 })
   * ```
   */
  async set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: SetOptions,
  ): Promise<void> {
    const ttl = options?.ttl ?? this.options.defaultTTL
    const serializedValue = JSON.stringify(value)

    await this.engine.setItem(key, serializedValue, ttl)
  }

  /**
   * 删除指定键的缓存
   *
   * @param key - 缓存键
   *
   * @example
   * ```typescript
   * await cache.remove('user')
   * ```
   */
  async remove(key: string): Promise<void> {
    await this.engine.removeItem(key)
  }

  /**
   * 清空缓存
   *
   * @param _engine - 存储引擎（当前仅支持 memory，参数保留用于未来扩展）
   *
   * @example
   * ```typescript
   * await cache.clear()
   * ```
   */
  async clear(_engine?: StorageEngine): Promise<void> {
    await this.engine.clear()
    this.hits = 0
    this.misses = 0
  }

  /**
   * 检查键是否存在
   *
   * @param key - 缓存键
   * @returns 是否存在且未过期
   *
   * @example
   * ```typescript
   * if (await cache.has('user')) {
   *   console.log('用户缓存存在')
   * }
   * ```
   */
  async has(key: string): Promise<boolean> {
    return await this.engine.hasItem(key)
  }

  /**
   * 获取所有键名
   *
   * @param _engine - 存储引擎（当前仅支持 memory，参数保留用于未来扩展）
   * @returns 键名数组
   *
   * @example
   * ```typescript
   * const keys = await cache.keys()
   * console.log('缓存键:', keys)
   * ```
   */
  async keys(_engine?: StorageEngine): Promise<string[]> {
    return await this.engine.keys()
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 统计信息对象
   *
   * @example
   * ```typescript
   * const stats = await cache.getStats()
   * console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
   * console.log(`已使用: ${(stats.usedSize / 1024 / 1024).toFixed(2)} MB`)
   * ```
   */
  async getStats(): Promise<CacheStats> {
    const totalRequests = this.hits + this.misses
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0
    const evictionStats = this.engine.getEvictionStats()

    return {
      totalKeys: await this.engine.length(),
      hits: this.hits,
      misses: this.misses,
      hitRate,
      usedSize: this.engine.usedSize,
      maxSize: this.engine.maxSize,
      evictionStats: {
        totalEvictions: evictionStats.totalEvictions,
        strategy: evictionStats.strategy,
      },
    }
  }

  /**
   * 记忆函数：如果缓存不存在则执行 fetcher 并缓存结果
   *
   * 这是一个非常实用的模式，可以自动处理缓存的读取和写入
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @param fetcher - 数据获取函数（同步或异步）
   * @param options - 设置选项
   * @param options.ttl - 缓存过期时间（毫秒）
   * @param options.refresh - 是否强制刷新缓存
   * @returns 缓存值或新获取的值
   *
   * @example
   * ```typescript
   * // 基本用法
   * const user = await cache.remember('user:123', async () => {
   *   return await fetchUserFromAPI(123)
   * })
   *
   * // 自定义 TTL
   * const user = await cache.remember('user:123', () => fetchUser(123), {
   *   ttl: 5 * 60 * 1000 // 5分钟
   * })
   *
   * // 强制刷新
   * const user = await cache.remember('user:123', () => fetchUser(123), {
   *   refresh: true
   * })
   * ```
   */
  async remember<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: SetOptions & { refresh?: boolean },
  ): Promise<T> {
    // 如果不强制刷新，先尝试获取缓存
    if (!options?.refresh) {
      const existing = await this.get<T>(key)
      if (existing !== null) {
        return existing
      }
    }

    // 执行 fetcher 获取数据
    const value = await fetcher()
    await this.set(key, value, options)

    return value
  }

  /**
   * 批量获取缓存值
   *
   * @typeParam T - 缓存值类型
   * @param keys - 缓存键数组
   * @returns 值数组（未找到的为 null）
   *
   * @example
   * ```typescript
   * const [user1, user2, user3] = await cache.mget<User>([
   *   'user:1', 'user:2', 'user:3'
   * ])
   * ```
   */
  async mget<T extends SerializableValue = SerializableValue>(keys: string[]): Promise<Array<T | null>> {
    const results = await this.engine.batchGet(keys)

    return results.map((rawValue) => {
      if (rawValue === null) {
        this.misses++
        return null
      }

      this.hits++
      try {
        return JSON.parse(rawValue) as T
      }
      catch {
        return rawValue as unknown as T
      }
    })
  }

  /**
   * 批量设置缓存值
   *
   * @param items - 要设置的键值对数组
   * @returns 设置结果数组
   *
   * @example
   * ```typescript
   * await cache.mset([
   *   { key: 'user:1', value: user1 },
   *   { key: 'user:2', value: user2, ttl: 5 * 60 * 1000 }
   * ])
   * ```
   */
  async mset<T extends SerializableValue = SerializableValue>(
    items: Array<{ key: string, value: T, ttl?: number }>,
  ): Promise<boolean[]> {
    const serializedItems = items.map(item => ({
      key: item.key,
      value: JSON.stringify(item.value),
      ttl: item.ttl ?? this.options.defaultTTL,
    }))

    return await this.engine.batchSet(serializedItems)
  }

  /**
   * 批量删除缓存值
   *
   * @param keys - 要删除的键数组
   * @returns 删除结果数组
   *
   * @example
   * ```typescript
   * await cache.mremove(['user:1', 'user:2', 'user:3'])
   * ```
   */
  async mremove(keys: string[]): Promise<boolean[]> {
    return await this.engine.batchRemove(keys)
  }

  /**
   * 设置淘汰策略
   *
   * @param strategy - 策略名称（'LRU' | 'LFU' | 'FIFO' | 'MRU' | 'Random' | 'TTL' | 'ARC'）
   *
   * @example
   * ```typescript
   * cache.setEvictionStrategy('LFU')
   * ```
   */
  setEvictionStrategy(strategy: string): void {
    this.engine.setEvictionStrategy(strategy)
  }

  /**
   * 手动触发过期项清理
   *
   * 通常不需要手动调用，引擎会自动定期清理
   *
   * @example
   * ```typescript
   * await cache.cleanup()
   * ```
   */
  async cleanup(): Promise<void> {
    await this.engine.cleanup()
  }

  /**
   * 销毁缓存管理器，清理所有资源
   *
   * 在不再需要缓存时调用，释放定时器和内存
   *
   * @example
   * ```typescript
   * cache.destroy()
   * ```
   */
  destroy(): void {
    this.engine.destroy()
  }
}
