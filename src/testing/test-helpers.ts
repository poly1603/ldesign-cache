/**
 * 缓存测试辅助工具
 * 
 * 提供便捷的测试工具函数，用于单元测试和集成测试
 * 
 * @example
 * ```typescript
 * import { CacheTestHelper } from '@ldesign/cache/testing'
 * 
 * describe('My Cache Tests', () => {
 *   it('should cache data', async () => {
 *     const cache = CacheTestHelper.createTestCache()
 *     await cache.set('key', 'value')
 *     
 *     const value = await cache.get('key')
 *     expect(value).toBe('value')
 *   })
 * })
 * ```
 */

import type { CacheOptions, SerializableValue } from '../types'
import { CacheManager } from '../core/cache-manager'

/**
 * 缓存测试辅助类
 */
export class CacheTestHelper {
  /**
   * 创建测试用的内存缓存
   * 
   * 特点：
   * - 仅使用内存引擎（不污染真实存储）
   * - 禁用自动清理（避免测试中的异步问题）
   * - 可自定义配置
   * 
   * @param options - 缓存配置选项
   * @returns 缓存管理器实例
   * 
   * @example
   * ```typescript
   * const cache = CacheTestHelper.createTestCache({
   *   defaultTTL: 1000,
   *   debug: true,
   * })
   * ```
   */
  static createTestCache(options?: Partial<CacheOptions>): CacheManager {
    return new CacheManager({
      defaultEngine: 'memory',
      cleanupInterval: undefined, // 禁用自动清理
      debug: false, // 禁用调试日志
      ...options,
    })
  }

  /**
   * 等待异步条件满足
   * 
   * 轮询检查条件，直到满足或超时
   * 
   * @param condition - 条件函数
   * @param timeout - 超时时间（毫秒）
   * @param interval - 检查间隔（毫秒）
   * @throws {Error} 超时时抛出错误
   * 
   * @example
   * ```typescript
   * await CacheTestHelper.waitFor(
   *   async () => (await cache.get('key')) !== null,
   *   5000
   * )
   * ```
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 10,
  ): Promise<void> {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      if (await Promise.resolve(condition())) {
        return
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`)
  }

  /**
   * 填充测试数据
   * 
   * 批量填充指定数量的测试缓存项
   * 
   * @param cache - 缓存管理器
   * @param count - 填充数量
   * @param options - 可选配置
   * @returns 生成的键数组
   * 
   * @example
   * ```typescript
   * const keys = await CacheTestHelper.seedCache(cache, 100, {
   *   keyPrefix: 'test',
   *   valueSize: 1024, // 每个值约1KB
   * })
   * ```
   */
  static async seedCache(
    cache: CacheManager,
    count: number,
    options?: {
      keyPrefix?: string
      valueSize?: number
      ttl?: number
      dataGenerator?: (index: number) => SerializableValue
    },
  ): Promise<string[]> {
    const prefix = options?.keyPrefix || 'test-key'
    const valueSize = options?.valueSize || 100
    const keys: string[] = []

    for (let i = 0; i < count; i++) {
      const key = `${prefix}-${i}`

      // 生成测试数据
      const value = options?.dataGenerator
        ? options.dataGenerator(i)
        : {
          index: i,
          data: 'x'.repeat(valueSize),
          timestamp: Date.now(),
        }

      await cache.set(key, value, {
        ttl: options?.ttl,
      })

      keys.push(key)
    }

    return keys
  }

  /**
   * 模拟缓存操作序列
   * 
   * 执行一系列缓存操作，用于测试复杂场景
   * 
   * @param cache - 缓存管理器
   * @param operations - 操作序列
   * @returns 操作结果数组
   * 
   * @example
   * ```typescript
   * const results = await CacheTestHelper.simulateOperations(cache, [
   *   { type: 'set', key: 'key1', value: 'value1' },
   *   { type: 'get', key: 'key1' },
   *   { type: 'remove', key: 'key1' },
   *   { type: 'get', key: 'key1' }, // 应该返回null
   * ])
   * ```
   */
  static async simulateOperations(
    cache: CacheManager,
    operations: Array<
      | { type: 'set', key: string, value: SerializableValue, ttl?: number }
      | { type: 'get', key: string }
      | { type: 'remove', key: string }
      | { type: 'clear' }
    >,
  ): Promise<Array<{ type: string, result: any, error?: Error }>> {
    const results: Array<{ type: string, result: any, error?: Error }> = []

    for (const op of operations) {
      try {
        let result: any

        switch (op.type) {
          case 'set':
            await cache.set(op.key, op.value, { ttl: op.ttl })
            result = undefined
            break

          case 'get':
            result = await cache.get(op.key)
            break

          case 'remove':
            await cache.remove(op.key)
            result = undefined
            break

          case 'clear':
            await cache.clear()
            result = undefined
            break
        }

        results.push({ type: op.type, result })
      }
      catch (error) {
        results.push({
          type: op.type,
          result: null,
          error: error as Error,
        })
      }
    }

    return results
  }

  /**
   * 断言缓存状态
   * 
   * 验证缓存的状态是否符合预期
   * 
   * @param cache - 缓存管理器
   * @param assertions - 断言配置
   * @throws {Error} 当断言失败时
   * 
   * @example
   * ```typescript
   * await CacheTestHelper.assertCacheState(cache, {
   *   totalItems: 10,
   *   hitRate: { min: 0.8 },
   *   memoryUsage: { max: 1024 * 1024 },
   * })
   * ```
   */
  static async assertCacheState(
    cache: CacheManager,
    assertions: {
      totalItems?: number
      hitRate?: { min?: number, max?: number }
      memoryUsage?: { min?: number, max?: number }
      hasKey?: string
      notHasKey?: string
    },
  ): Promise<void> {
    const stats = await cache.getStats()

    if (assertions.totalItems !== undefined) {
      if (stats.totalItems !== assertions.totalItems) {
        throw new Error(
          `Expected ${assertions.totalItems} items, got ${stats.totalItems}`,
        )
      }
    }

    if (assertions.hitRate) {
      if (assertions.hitRate.min !== undefined && stats.hitRate < assertions.hitRate.min) {
        throw new Error(
          `Hit rate ${stats.hitRate} is below minimum ${assertions.hitRate.min}`,
        )
      }
      if (assertions.hitRate.max !== undefined && stats.hitRate > assertions.hitRate.max) {
        throw new Error(
          `Hit rate ${stats.hitRate} is above maximum ${assertions.hitRate.max}`,
        )
      }
    }

    if (assertions.memoryUsage) {
      if (assertions.memoryUsage.min !== undefined && stats.totalSize < assertions.memoryUsage.min) {
        throw new Error(
          `Memory usage ${stats.totalSize} is below minimum ${assertions.memoryUsage.min}`,
        )
      }
      if (assertions.memoryUsage.max !== undefined && stats.totalSize > assertions.memoryUsage.max) {
        throw new Error(
          `Memory usage ${stats.totalSize} is above maximum ${assertions.memoryUsage.max}`,
        )
      }
    }

    if (assertions.hasKey) {
      const exists = await cache.has(assertions.hasKey)
      if (!exists) {
        throw new Error(`Expected key "${assertions.hasKey}" to exist`)
      }
    }

    if (assertions.notHasKey) {
      const exists = await cache.has(assertions.notHasKey)
      if (exists) {
        throw new Error(`Expected key "${assertions.notHasKey}" to not exist`)
      }
    }
  }

  /**
   * 创建缓存快照
   * 
   * 捕获当前缓存状态，用于后续对比
   * 
   * @param cache - 缓存管理器
   * @returns 快照对象
   */
  static async createSnapshot(cache: CacheManager): Promise<{
    stats: Awaited<ReturnType<CacheManager['getStats']>>
    keys: string[]
    timestamp: number
  }> {
    return {
      stats: await cache.getStats(),
      keys: await cache.keys(),
      timestamp: Date.now(),
    }
  }

  /**
   * 对比两个快照
   * 
   * @param snapshot1 - 第一个快照
   * @param snapshot2 - 第二个快照
   * @returns 差异信息
   */
  static compareSnapshots(
    snapshot1: Awaited<ReturnType<typeof CacheTestHelper.createSnapshot>>,
    snapshot2: Awaited<ReturnType<typeof CacheTestHelper.createSnapshot>>,
  ): {
    itemsDelta: number
    sizeDelta: number
    hitRateDelta: number
    newKeys: string[]
    removedKeys: string[]
    duration: number
  } {
    const newKeys = snapshot2.keys.filter(k => !snapshot1.keys.includes(k))
    const removedKeys = snapshot1.keys.filter(k => !snapshot2.keys.includes(k))

    return {
      itemsDelta: snapshot2.stats.totalItems - snapshot1.stats.totalItems,
      sizeDelta: snapshot2.stats.totalSize - snapshot1.stats.totalSize,
      hitRateDelta: snapshot2.stats.hitRate - snapshot1.stats.hitRate,
      newKeys,
      removedKeys,
      duration: snapshot2.timestamp - snapshot1.timestamp,
    }
  }

  /**
   * 清理测试缓存
   * 
   * 清空缓存并重置状态
   * 
   * @param cache - 缓存管理器
   */
  static async cleanupCache(cache: CacheManager): Promise<void> {
    await cache.clear()
    await cache.cleanup()
  }
}

/**
 * Mock存储引擎（用于测试）
 */
export class MockStorageEngine {
  readonly name = 'mock' as const
  readonly available = true
  readonly maxSize = 100 * 1024 * 1024

  private storage = new Map<string, string>()
  private _usedSize = 0

  // 模拟延迟（用于测试异步行为）
  delay: number = 0

  // 模拟错误（用于测试错误处理）
  shouldFail: boolean = false
  failureRate: number = 0 // 0-1，失败概率

  get usedSize(): number {
    return this._usedSize
  }

  async setItem(key: string, value: string, ttl?: number): Promise<void> {
    await this.simulateDelay()
    this.checkFailure('setItem')

    const oldSize = this.storage.has(key)
      ? (this.storage.get(key)?.length || 0)
      : 0

    this.storage.set(key, value)
    this._usedSize = this._usedSize - oldSize + value.length
  }

  async getItem(key: string): Promise<string | null> {
    await this.simulateDelay()
    this.checkFailure('getItem')

    return this.storage.get(key) || null
  }

  async removeItem(key: string): Promise<void> {
    await this.simulateDelay()
    this.checkFailure('removeItem')

    const value = this.storage.get(key)
    if (value) {
      this._usedSize -= value.length
    }
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    await this.simulateDelay()
    this.checkFailure('clear')

    this.storage.clear()
    this._usedSize = 0
  }

  async keys(): Promise<string[]> {
    await this.simulateDelay()
    return Array.from(this.storage.keys())
  }

  async hasItem(key: string): Promise<boolean> {
    await this.simulateDelay()
    return this.storage.has(key)
  }

  async length(): Promise<number> {
    await this.simulateDelay()
    return this.storage.size
  }

  async cleanup(): Promise<void> {
    await this.simulateDelay()
    // Mock不处理过期
  }

  private async simulateDelay(): Promise<void> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay))
    }
  }

  private checkFailure(operation: string): void {
    if (this.shouldFail) {
      throw new Error(`Mock engine: ${operation} failed`)
    }

    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      throw new Error(`Mock engine: ${operation} randomly failed`)
    }
  }

  // 测试辅助方法

  /**
   * 获取原始存储数据（用于验证）
   */
  getRawStorage(): Map<string, string> {
    return new Map(this.storage)
  }

  /**
   * 重置引擎状态
   */
  reset(): void {
    this.storage.clear()
    this._usedSize = 0
    this.delay = 0
    this.shouldFail = false
    this.failureRate = 0
  }
}

/**
 * 性能基准测试工具
 */
export class CacheBenchmark {
  /**
   * 测量操作性能
   * 
   * @param operation - 要测量的操作
   * @param iterations - 迭代次数
   * @returns 性能统计
   * 
   * @example
   * ```typescript
   * const result = await CacheBenchmark.measure(
   *   async () => await cache.get('key'),
   *   1000
   * )
   * console.log('平均耗时:', result.avgTime)
   * ```
   */
  static async measure(
    operation: () => Promise<any>,
    iterations: number = 100,
  ): Promise<{
    iterations: number
    totalTime: number
    avgTime: number
    minTime: number
    maxTime: number
    p50: number
    p95: number
    p99: number
  }> {
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await operation()
      const duration = performance.now() - start
      times.push(duration)
    }

    const sorted = [...times].sort((a, b) => a - b)
    const totalTime = times.reduce((a, b) => a + b, 0)

    return {
      iterations,
      totalTime,
      avgTime: totalTime / iterations,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * 对比两种实现的性能
   * 
   * @param baseline - 基准实现
   * @param optimized - 优化后的实现
   * @param iterations - 迭代次数
   * @returns 对比结果
   */
  static async compare(
    baseline: () => Promise<any>,
    optimized: () => Promise<any>,
    iterations: number = 100,
  ): Promise<{
    baseline: Awaited<ReturnType<typeof CacheBenchmark.measure>>
    optimized: Awaited<ReturnType<typeof CacheBenchmark.measure>>
    speedup: number
    improvement: string
  }> {
    const baselineResult = await this.measure(baseline, iterations)
    const optimizedResult = await this.measure(optimized, iterations)

    const speedup = baselineResult.avgTime / optimizedResult.avgTime
    const improvement = speedup > 1
      ? `${((speedup - 1) * 100).toFixed(1)}% faster`
      : `${((1 - speedup) * 100).toFixed(1)}% slower`

    return {
      baseline: baselineResult,
      optimized: optimizedResult,
      speedup,
      improvement,
    }
  }
}

