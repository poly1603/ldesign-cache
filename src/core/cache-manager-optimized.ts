/**
 * 优化的缓存管理器
 * 
 * 集成了多种性能优化技术：
 * 1. 字符串驻留
 * 2. 智能序列化
 * 3. 零拷贝
 * 4. 分层缓存
 * 5. 批量操作优化
 */

import type {
  CacheEvent,
  CacheEventListener,
  CacheEventType,
  CacheMetadata,
  CacheOptions,
  CacheStats,
  ICacheManager,
  IStorageEngine,
  SerializableValue,
  SetOptions,
  StorageEngine,
} from '../types'

import { CacheManager } from './cache-manager'
import { getGlobalStringIntern, StringIntern } from '../utils/string-intern'
import { SmartSerializer, IncrementalSerializer } from '../utils/smart-serializer'
import { ZeroCopyCache } from '../utils/zero-copy'
import { TieredCache, WeakCache } from '../utils/weak-cache'
import { BatchPipeline } from '../utils/batch-pipeline-optimized'
import { AdvancedObjectPool } from '../utils/object-pool-advanced'

export interface OptimizedCacheOptions extends CacheOptions {
  /** 启用字符串驻留 */
  enableStringIntern?: boolean
  /** 启用智能序列化 */
  enableSmartSerializer?: boolean
  /** 启用零拷贝 */
  enableZeroCopy?: boolean
  /** 启用分层缓存 */
  enableTieredCache?: boolean
  /** 启用增量序列化 */
  enableIncrementalSerializer?: boolean
  /** 分层缓存热区大小 */
  tieredCacheHotSize?: number
  /** 分层缓存提升阈值 */
  tieredCachePromotionThreshold?: number
  /** 批处理大小 */
  batchSize?: number
  /** 批处理并发数 */
  batchConcurrency?: number
}

/**
 * 优化的缓存管理器
 */
export class OptimizedCacheManager extends CacheManager {
  // 优化组件
  private stringIntern?: StringIntern
  private smartSerializer?: SmartSerializer
  private incrementalSerializer?: IncrementalSerializer
  private zeroCopyCache?: ZeroCopyCache
  private tieredCache?: TieredCache<any>
  private weakCache?: WeakCache<any>
  private batchPipeline?: BatchPipeline

  // 对象池
  private metadataPool: AdvancedObjectPool<CacheMetadata>
  private cacheItemPool: AdvancedObjectPool<any>

  // 优化配置
  private optimizedConfig: Required<OptimizedCacheOptions>

  constructor(options: OptimizedCacheOptions = {}) {
    super(options)

    this.optimizedConfig = {
      ...options,
      enableStringIntern: options.enableStringIntern ?? true,
      enableSmartSerializer: options.enableSmartSerializer ?? true,
      enableZeroCopy: options.enableZeroCopy ?? true,
      enableTieredCache: options.enableTieredCache ?? true,
      enableIncrementalSerializer: options.enableIncrementalSerializer ?? false,
      tieredCacheHotSize: options.tieredCacheHotSize || 100,
      tieredCachePromotionThreshold: options.tieredCachePromotionThreshold || 3,
      batchSize: options.batchSize || 50,
      batchConcurrency: options.batchConcurrency || 4,
    } as Required<OptimizedCacheOptions>

    this.initializeOptimizations()

    // 初始化对象池
    this.metadataPool = new AdvancedObjectPool({
      factory: () => ({
        createdAt: 0,
        updatedAt: 0,
        expiresAt: 0,
        version: 1,
        engine: 'memory' as StorageEngine,
        encrypted: false,
        compressed: false,
        tags: [],
      }),
      reset: (obj) => {
        obj.createdAt = 0
        obj.updatedAt = 0
        obj.expiresAt = 0
        obj.version = 1
        obj.engine = 'memory'
        obj.encrypted = false
        obj.compressed = false
        obj.tags = []
      },
      initialSize: 50,
      maxSize: 500,
      autoResize: true,
    })

    this.cacheItemPool = new AdvancedObjectPool({
      factory: () => ({ value: null, metadata: null }),
      reset: (obj) => {
        obj.value = null
        obj.metadata = null
      },
      initialSize: 50,
      maxSize: 500,
      autoResize: true,
    })
  }

  /**
   * 初始化优化组件
   */
  private initializeOptimizations(): void {
    // 字符串驻留
    if (this.optimizedConfig.enableStringIntern) {
      this.stringIntern = getGlobalStringIntern({
        maxSize: 10000,
        minUsageCount: 2,
      })
    }

    // 智能序列化
    if (this.optimizedConfig.enableSmartSerializer) {
      this.smartSerializer = new SmartSerializer({
        enableCache: true,
        enableCompression: true,
        cacheSize: 1000,
      })
    }

    // 增量序列化
    if (this.optimizedConfig.enableIncrementalSerializer) {
      this.incrementalSerializer = new IncrementalSerializer()
    }

    // 零拷贝缓存
    if (this.optimizedConfig.enableZeroCopy) {
      this.zeroCopyCache = new ZeroCopyCache({
        useCopyOnWrite: true,
        useStructuredClone: true,
      })
    }

    // 分层缓存
    if (this.optimizedConfig.enableTieredCache) {
      this.tieredCache = new TieredCache({
        maxHotSize: this.optimizedConfig.tieredCacheHotSize,
        promotionThreshold: this.optimizedConfig.tieredCachePromotionThreshold,
      })

      // 弱引用缓存（用于大对象）
      this.weakCache = new WeakCache({
        enableFinalization: true,
        onCleanup: (key) => {
          console.debug(`[WeakCache] Cleaned up key: ${key}`)
        },
      })
    }

    // 批处理管道
    this.batchPipeline = new BatchPipeline({
      batchSize: this.optimizedConfig.batchSize,
      concurrency: this.optimizedConfig.batchConcurrency,
      preserveOrder: false,
    })
  }

  /**
   * 优化的 set 方法
   */
  async set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: SetOptions,
  ): Promise<void> {
    // 字符串驻留优化
    if (this.stringIntern) {
      key = this.stringIntern.intern(key)
    }

    // 分层缓存快速路径
    if (this.tieredCache && !options?.engine) {
      this.tieredCache.set(key, value, options?.ttl)

      // 对于大对象，同时使用弱引用缓存
      if (this.shouldUseWeakCache(value)) {
        this.weakCache?.set(key, value as any, options?.ttl)
      }
    }

    // 零拷贝优化
    if (this.zeroCopyCache && this.isZeroCopyCandidate(value)) {
      this.zeroCopyCache.set(key, value)
    }

    // 调用父类方法处理持久化存储
    await super.set(key, value, options)
  }

  /**
   * 优化的 get 方法
   */
  async get<T extends SerializableValue = SerializableValue>(
    key: string,
  ): Promise<T | null> {
    // 字符串驻留优化
    if (this.stringIntern) {
      key = this.stringIntern.intern(key)
    }

    // 检查分层缓存
    if (this.tieredCache) {
      const cached = this.tieredCache.get(key)
      if (cached !== undefined) {
        return cached as T
      }
    }

    // 检查零拷贝缓存
    if (this.zeroCopyCache) {
      const ref = this.zeroCopyCache.getRef(key)
      if (ref) {
        return ref as T
      }
    }

    // 检查弱引用缓存
    if (this.weakCache) {
      const weak = this.weakCache.get(key)
      if (weak) {
        // 提升到热缓存
        this.tieredCache?.set(key, weak)
        return weak as T
      }
    }

    // 从持久化存储获取
    const value = await super.get<T>(key)

    // 更新缓存
    if (value !== null && this.tieredCache) {
      this.tieredCache.set(key, value)
    }

    return value
  }

  /**
   * 优化的批量设置
   */
  async mset<T extends SerializableValue>(
    items: Array<{ key: string; value: T; options?: SetOptions }>,
  ): Promise<void> {
    if (!this.batchPipeline) {
      return super.mset(items)
    }

    // 使用批量管道处理
    const result = await this.batchPipeline.process(
      items,
      async (item) => {
        await this.set(item.key, item.value, item.options)
      }
    )

    if (result.failed.length > 0) {
      throw new Error(
        `Batch set failed for ${result.failed.length} items: ${result.failed.map(f => f.error.message).join(', ')}`
      )
    }
  }

  /**
   * 优化的批量获取
   */
  async mget<T extends SerializableValue = SerializableValue>(
    keys: string[],
  ): Promise<Array<T | null>> {
    if (!this.batchPipeline) {
      return super.mget(keys)
    }

    // 先从缓存批量获取
    const results: Array<T | null> = new Array(keys.length)
    const missedIndices: number[] = []

    for (let i = 0; i < keys.length; i++) {
      const key = this.stringIntern ? this.stringIntern.intern(keys[i]) : keys[i]

      // 检查缓存
      if (this.tieredCache) {
        const cached = this.tieredCache.get(key)
        if (cached !== undefined) {
          results[i] = cached as T
          continue
        }
      }

      missedIndices.push(i)
    }

    // 批量获取未命中的
    if (missedIndices.length > 0) {
      const missedKeys = missedIndices.map(i => keys[i])
      const missedValues = await super.mget<T>(missedKeys)

      for (let i = 0; i < missedIndices.length; i++) {
        const index = missedIndices[i]
        const value = missedValues[i]
        results[index] = value

        // 更新缓存
        if (value !== null && this.tieredCache) {
          this.tieredCache.set(keys[index], value)
        }
      }
    }

    return results
  }

  /**
   * 流式处理大批量操作
   */
  async *processStream<T extends SerializableValue>(
    items: AsyncIterable<{ key: string; value: T; options?: SetOptions }>,
  ): AsyncGenerator<{ key: string; success: boolean; error?: Error }> {
    if (!this.batchPipeline) {
      // 降级到逐个处理
      for await (const item of items) {
        try {
          await this.set(item.key, item.value, item.options)
          yield { key: item.key, success: true }
        } catch (error) {
          yield { key: item.key, success: false, error: error as Error }
        }
      }
      return
    }

    // 使用流式批处理
    const processor = async (item: { key: string; value: T; options?: SetOptions }) => {
      await this.set(item.key, item.value, item.options)
      return { key: item.key, success: true }
    }

    for await (const result of this.batchPipeline.processStream(items, processor)) {
      yield result
    }
  }

  /**
   * 重写序列化方法使用智能序列化
   */
  protected async serializeValue(
    value: SerializableValue,
    options?: SetOptions,
  ): Promise<string> {
    // 使用增量序列化（如果启用）
    if (this.incrementalSerializer && options?.incrementalKey) {
      const result = this.incrementalSerializer.serializeDelta(
        options.incrementalKey,
        value
      )
      if (result) {
        return typeof result.data === 'string'
          ? result.data
          : btoa(String.fromCharCode(...new Uint8Array(result.data as ArrayBuffer)))
      }
    }

    // 使用智能序列化
    if (this.smartSerializer) {
      const result = this.smartSerializer.serialize(value)
      return typeof result.data === 'string'
        ? result.data
        : btoa(String.fromCharCode(...new Uint8Array(result.data as ArrayBuffer)))
    }

    // 降级到父类序列化
    return super.serializeValue(value, options)
  }

  /**
   * 重写反序列化方法
   */
  protected async deserializeValue<T>(
    data: string,
    encrypted: boolean,
  ): Promise<T> {
    // 尝试使用智能反序列化
    if (this.smartSerializer) {
      try {
        // 检测是否是智能序列化的数据
        if (data.startsWith('{') || data.startsWith('[') || data.startsWith('"')) {
          const result = this.smartSerializer.deserialize({
            data,
            format: 'json',
            size: data.length,
            compressed: false,
          })
          return result as T
        }
      } catch {
        // 降级到默认反序列化
      }
    }

    return super.deserializeValue<T>(data, encrypted)
  }

  /**
   * 判断是否应该使用弱引用缓存
   */
  private shouldUseWeakCache(value: any): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    // 简单的大小估算
    const size = JSON.stringify(value).length
    return size > 10240 // 10KB以上使用弱引用
  }

  /**
   * 判断是否适合零拷贝
   */
  private isZeroCopyCandidate(value: any): boolean {
    return typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.keys(value).length > 5
  }

  /**
   * 获取优化统计信息
   */
  async getOptimizationStats(): Promise<{
    stringIntern?: any
    smartSerializer?: any
    tieredCache?: any
    objectPools?: any
  }> {
    const stats: any = {}

    if (this.stringIntern) {
      stats.stringIntern = this.stringIntern.getStats()
    }

    if (this.smartSerializer) {
      stats.smartSerializer = this.smartSerializer.getStats()
    }

    if (this.tieredCache) {
      stats.tieredCache = this.tieredCache.getStats()
    }

    stats.objectPools = {
      metadata: this.metadataPool.getStats(),
      cacheItem: this.cacheItemPool.getStats(),
    }

    return stats
  }

  /**
   * 响应内存压力
   */
  respondToMemoryPressure(level: 'low' | 'medium' | 'high' | 'critical'): void {
    // 调整对象池
    this.metadataPool.respondToMemoryPressure(level)
    this.cacheItemPool.respondToMemoryPressure(level)

    // 清理缓存
    if (level === 'critical') {
      this.tieredCache?.clear()
      this.zeroCopyCache?.clear()
      this.smartSerializer?.clearCache()
    } else if (level === 'high') {
      // 执行垃圾回收
      this.weakCache?.gc()
    }
  }

  /**
   * 销毁优化组件
   */
  async destroy(): Promise<void> {
    // 销毁优化组件
    this.stringIntern?.destroy()
    this.smartSerializer?.clearCache()
    this.incrementalSerializer?.clearAllBaseStates()
    this.tieredCache?.clear()
    this.weakCache?.clear()
    this.metadataPool.destroy()
    this.cacheItemPool.destroy()

    // 调用父类销毁
    await super.destroy()
  }
}

/**
 * 创建优化的缓存管理器
 */
export function createOptimizedCache(options?: OptimizedCacheOptions): OptimizedCacheManager {
  return new OptimizedCacheManager(options)
}

