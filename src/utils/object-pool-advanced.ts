/**
 * 高级对象池 - 支持动态大小调整和智能管理
 * 
 * 相比基础对象池的改进：
 * 1. 动态调整池大小（根据使用率）
 * 2. 内存压力响应
 * 3. 对象年龄管理
 * 4. 预热支持
 * 5. 详细的性能指标
 * 
 * @example
 * ```typescript
 * const pool = new AdvancedObjectPool({
 *   factory: () => ({ data: null }),
 *   reset: (obj) => { obj.data = null },
 *   initialSize: 10,
 *   maxSize: 100,
 *   minSize: 5,
 *   autoResize: true
 * })
 * ```
 */

export interface AdvancedObjectPoolConfig<T> {
  /** 对象工厂函数 */
  factory: () => T
  /** 对象重置函数 */
  reset?: (obj: T) => void
  /** 初始池大小 */
  initialSize?: number
  /** 最大池大小 */
  maxSize?: number
  /** 最小池大小 */
  minSize?: number
  /** 是否自动调整大小 */
  autoResize?: boolean
  /** 调整大小的检查间隔（毫秒） */
  resizeInterval?: number
  /** 高使用率阈值（触发扩容） */
  highUsageThreshold?: number
  /** 低使用率阈值（触发缩容） */
  lowUsageThreshold?: number
  /** 对象最大年龄（毫秒） */
  maxObjectAge?: number
}

export interface PoolStats {
  /** 当前池大小 */
  poolSize: number
  /** 已分配对象数 */
  allocatedCount: number
  /** 空闲对象数 */
  availableCount: number
  /** 累计获取次数 */
  totalAcquired: number
  /** 累计释放次数 */
  totalReleased: number
  /** 累计创建次数 */
  totalCreated: number
  /** 池命中率 */
  hitRate: number
  /** 平均使用率 */
  avgUsageRate: number
  /** 内存估算（字节） */
  estimatedMemory: number
}

interface PooledObject<T> {
  obj: T
  createdAt: number
  lastUsedAt: number
  useCount: number
}

export class AdvancedObjectPool<T> {
  private pool: PooledObject<T>[] = []
  private allocated = new Set<T>()
  private config: Required<AdvancedObjectPoolConfig<T>>

  // 统计数据
  private stats = {
    totalAcquired: 0,
    totalReleased: 0,
    totalCreated: 0,
    hitCount: 0,
    missCount: 0,
  }

  // 使用率历史（用于动态调整）
  private usageHistory: number[] = []
  private readonly MAX_HISTORY = 10

  // 调整大小定时器
  private resizeTimer?: number

  // 对象大小估算（字节）
  private objectSizeEstimate = 0

  constructor(config: AdvancedObjectPoolConfig<T>) {
    this.config = {
      factory: config.factory,
      reset: config.reset || (() => { }),
      initialSize: config.initialSize || 10,
      maxSize: config.maxSize || 100,
      minSize: config.minSize || 5,
      autoResize: config.autoResize ?? true,
      resizeInterval: config.resizeInterval || 30000, // 30秒
      highUsageThreshold: config.highUsageThreshold || 0.8,
      lowUsageThreshold: config.lowUsageThreshold || 0.2,
      maxObjectAge: config.maxObjectAge || 300000, // 5分钟
    }

    // 预热池
    this.warmup()

    // 启动自动调整
    if (this.config.autoResize) {
      this.startAutoResize()
    }
  }

  /**
   * 预热对象池
   */
  private warmup(): void {
    const targetSize = Math.min(this.config.initialSize, this.config.maxSize)

    for (let i = 0; i < targetSize; i++) {
      const obj = this.config.factory()
      this.stats.totalCreated++

      // 估算对象大小（首次创建时）
      if (this.objectSizeEstimate === 0) {
        this.objectSizeEstimate = this.estimateObjectSize(obj)
      }

      this.pool.push({
        obj,
        createdAt: Date.now(),
        lastUsedAt: 0,
        useCount: 0,
      })
    }
  }

  /**
   * 获取对象
   */
  acquire(): T {
    this.stats.totalAcquired++

    // 清理过期对象
    this.cleanupExpired()

    // 记录当前使用率
    this.recordUsage()

    // 尝试从池中获取
    if (this.pool.length > 0) {
      const pooled = this.pool.pop()!
      const now = Date.now()

      // 检查对象年龄
      if (this.config.maxObjectAge > 0 &&
        now - pooled.createdAt > this.config.maxObjectAge) {
        // 对象太老，创建新的
        const newObj = this.config.factory()
        this.stats.totalCreated++
        this.stats.missCount++

        this.allocated.add(newObj)
        return newObj
      }

      // 重置并返回对象
      this.config.reset(pooled.obj)
      pooled.lastUsedAt = now
      pooled.useCount++

      this.allocated.add(pooled.obj)
      this.stats.hitCount++

      return pooled.obj
    }

    // 池为空，创建新对象
    const obj = this.config.factory()
    this.stats.totalCreated++
    this.stats.missCount++

    this.allocated.add(obj)
    return obj
  }

  /**
   * 释放对象
   */
  release(obj: T): void {
    if (!this.allocated.has(obj)) {
      console.warn('Attempting to release object not from this pool')
      return
    }

    this.stats.totalReleased++
    this.allocated.delete(obj)

    // 检查池是否已满
    if (this.pool.length >= this.config.maxSize) {
      return // 丢弃对象
    }

    // 将对象放回池中
    this.pool.push({
      obj,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 1,
    })
  }

  /**
   * 清理过期对象
   */
  private cleanupExpired(): void {
    if (this.config.maxObjectAge <= 0) return

    const now = Date.now()
    const validPool: PooledObject<T>[] = []

    for (const pooled of this.pool) {
      if (now - pooled.createdAt <= this.config.maxObjectAge) {
        validPool.push(pooled)
      }
    }

    this.pool = validPool
  }

  /**
   * 记录使用率
   */
  private recordUsage(): void {
    const totalObjects = this.pool.length + this.allocated.size
    const usageRate = totalObjects > 0 ? this.allocated.size / totalObjects : 0

    this.usageHistory.push(usageRate)

    if (this.usageHistory.length > this.MAX_HISTORY) {
      this.usageHistory.shift()
    }
  }

  /**
   * 获取平均使用率
   */
  private getAverageUsage(): number {
    if (this.usageHistory.length === 0) return 0

    const sum = this.usageHistory.reduce((a, b) => a + b, 0)
    return sum / this.usageHistory.length
  }

  /**
   * 启动自动调整大小
   */
  private startAutoResize(): void {
    const setIntervalFn =
      typeof window !== 'undefined' ? window.setInterval : globalThis.setInterval

    this.resizeTimer = setIntervalFn(() => {
      this.autoResize()
    }, this.config.resizeInterval) as unknown as number
  }

  /**
   * 自动调整池大小
   */
  private autoResize(): void {
    const avgUsage = this.getAverageUsage()
    const currentSize = this.pool.length

    // 高使用率，需要扩容
    if (avgUsage > this.config.highUsageThreshold) {
      const targetSize = Math.min(
        currentSize * 1.5,
        this.config.maxSize
      )
      const toAdd = Math.floor(targetSize - currentSize)

      for (let i = 0; i < toAdd; i++) {
        const obj = this.config.factory()
        this.stats.totalCreated++

        this.pool.push({
          obj,
          createdAt: Date.now(),
          lastUsedAt: 0,
          useCount: 0,
        })
      }
    }
    // 低使用率，需要缩容
    else if (avgUsage < this.config.lowUsageThreshold) {
      const targetSize = Math.max(
        currentSize * 0.7,
        this.config.minSize
      )
      const toRemove = Math.floor(currentSize - targetSize)

      // 移除最少使用的对象
      if (toRemove > 0) {
        this.pool.sort((a, b) => a.useCount - b.useCount)
        this.pool.splice(0, toRemove)
      }
    }
  }

  /**
   * 估算对象大小
   */
  private estimateObjectSize(obj: T): number {
    // 基础对象开销
    let size = 32

    if (typeof obj === 'object' && obj !== null) {
      // 估算属性数量
      const keys = Object.keys(obj)
      size += keys.length * 16 // 每个属性的开销

      // 估算值的大小
      for (const key of keys) {
        const value = (obj as any)[key]
        if (typeof value === 'string') {
          size += value.length * 2 // UTF-16
        } else if (typeof value === 'number') {
          size += 8
        } else if (typeof value === 'boolean') {
          size += 4
        } else if (value !== null && typeof value === 'object') {
          size += 64 // 对象引用估算
        }
      }
    }

    return size
  }

  /**
   * 响应内存压力
   */
  respondToMemoryPressure(level: 'low' | 'medium' | 'high' | 'critical'): void {
    switch (level) {
      case 'critical':
        // 清空池，只保留最小数量
        this.pool = this.pool.slice(0, this.config.minSize)
        break

      case 'high':
        // 减少到一半
        this.pool = this.pool.slice(0, Math.floor(this.pool.length / 2))
        break

      case 'medium':
        // 减少25%
        const reduce = Math.floor(this.pool.length * 0.25)
        this.pool = this.pool.slice(reduce)
        break

      case 'low':
        // 清理过期对象
        this.cleanupExpired()
        break
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): PoolStats {
    const poolSize = this.pool.length
    const allocatedCount = this.allocated.size

    return {
      poolSize,
      allocatedCount,
      availableCount: poolSize,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      totalCreated: this.stats.totalCreated,
      hitRate: this.stats.totalAcquired > 0
        ? this.stats.hitCount / this.stats.totalAcquired
        : 0,
      avgUsageRate: this.getAverageUsage(),
      estimatedMemory: (poolSize + allocatedCount) * this.objectSizeEstimate,
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = []
    this.allocated.clear()
    this.usageHistory = []
  }

  /**
   * 销毁池
   */
  destroy(): void {
    if (this.resizeTimer) {
      const clearIntervalFn =
        typeof window !== 'undefined' ? window.clearInterval : globalThis.clearInterval
      clearIntervalFn(this.resizeTimer)
      this.resizeTimer = undefined
    }

    this.clear()
  }
}

/**
 * 创建全局共享的对象池
 */
export function createSharedObjectPool<T>(
  name: string,
  config: AdvancedObjectPoolConfig<T>
): AdvancedObjectPool<T> {
  const poolsMap = (globalThis as any).__ldesign_object_pools__ || ((globalThis as any).__ldesign_object_pools__ = new Map())

  if (!poolsMap.has(name)) {
    poolsMap.set(name, new AdvancedObjectPool(config))
  }

  return poolsMap.get(name)
}


