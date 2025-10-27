/**
 * 性能跟踪器
 * 
 * 提供详细的性能指标收集和分析能力：
 * - 操作耗时统计（平均值、P95、P99）
 * - 引擎性能对比
 * - 内存使用监控
 * - 热点键分析
 * - 缓存效率分析
 * 
 * @example
 * ```typescript
 * const tracker = new PerformanceTracker()
 * 
 * // 跟踪操作
 * const endOp = tracker.startOperation('get')
 * await cache.get('key')
 * endOp()
 * 
 * // 获取指标
 * const metrics = tracker.getMetrics()
 * console.log('平均GET耗时:', metrics.operations.get.avgTime)
 * console.log('热点键:', metrics.hotKeys)
 * ```
 */

import type { StorageEngine } from '../types'

/**
 * 操作统计信息
 */
export interface OperationStats {
  /** 操作次数 */
  count: number
  /** 总耗时（毫秒） */
  totalTime: number
  /** 平均耗时（毫秒） */
  avgTime: number
  /** 最小耗时（毫秒） */
  minTime: number
  /** 最大耗时（毫秒） */
  maxTime: number
  /** P50（中位数） */
  p50: number
  /** P95（95百分位） */
  p95: number
  /** P99（99百分位） */
  p99: number
}

/**
 * 引擎性能统计
 */
export interface EnginePerformance {
  /** 读操作耗时（毫秒） */
  readTime: number
  /** 写操作耗时（毫秒） */
  writeTime: number
  /** 读操作次数 */
  readCount: number
  /** 写操作次数 */
  writeCount: number
  /** 平均读耗时 */
  avgReadTime: number
  /** 平均写耗时 */
  avgWriteTime: number
}

/**
 * 内存使用统计
 */
export interface MemoryUsage {
  /** 当前使用量（字节） */
  current: number
  /** 峰值使用量（字节） */
  peak: number
  /** 内存限制（字节） */
  limit: number
  /** 使用率（0-1） */
  utilization: number
  /** 压力等级 */
  pressure: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * 缓存效率统计
 */
export interface CacheEfficiency {
  /** 命中率（0-1） */
  hitRate: number
  /** 未命中率（0-1） */
  missRate: number
  /** 淘汰率（0-1） */
  evictionRate: number
  /** 序列化缓存命中率（0-1） */
  serializationCacheHitRate: number
}

/**
 * 热点键信息
 */
export interface HotKey {
  /** 缓存键 */
  key: string
  /** 访问次数 */
  accessCount: number
  /** 最后访问时间 */
  lastAccess: number
  /** 平均访问间隔（毫秒） */
  avgInterval?: number
}

/**
 * 完整性能指标
 */
export interface PerformanceMetrics {
  /** 操作耗时统计 */
  operations: {
    get: OperationStats
    set: OperationStats
    remove: OperationStats
    mget: OperationStats & { avgItemsPerOp: number }
    mset: OperationStats & { avgItemsPerOp: number }
  }

  /** 引擎性能统计 */
  engines: Record<StorageEngine, EnginePerformance>

  /** 内存使用情况 */
  memory: MemoryUsage

  /** 缓存效率 */
  efficiency: CacheEfficiency

  /** 热点键Top10 */
  hotKeys: HotKey[]

  /** 数据收集时间范围 */
  timeRange: {
    start: number
    end: number
    duration: number
  }
}

/**
 * 性能跟踪器配置
 */
export interface PerformanceTrackerConfig {
  /** 是否启用跟踪 */
  enabled?: boolean

  /** 历史数据保留条数（每个操作） */
  historySize?: number

  /** 热点键跟踪数量 */
  hotKeyLimit?: number

  /** 是否自动计算百分位数 */
  autoCalculatePercentiles?: boolean
}

/**
 * 性能跟踪器
 */
export class PerformanceTracker {
  /** 是否启用 */
  private enabled: boolean

  /** 操作耗时历史（滚动窗口） */
  private operationTimes = new Map<string, number[]>()

  /** 键访问计数 */
  private keyAccessCount = new Map<string, number>()

  /** 键访问时间戳历史 */
  private keyAccessHistory = new Map<string, number[]>()

  /** 引擎性能统计 */
  private engineStats = new Map<StorageEngine, {
    readTimes: number[]
    writeTimes: number[]
  }>()

  /** 内存使用历史 */
  private memoryHistory: number[] = []

  /** 内存限制 */
  private memoryLimit: number = 100 * 1024 * 1024

  /** 配置 */
  private config: Required<PerformanceTrackerConfig>

  /** 跟踪开始时间 */
  private startTime: number = Date.now()

  /**
   * 创建性能跟踪器
   * 
   * @param config - 配置选项
   */
  constructor(config?: PerformanceTrackerConfig) {
    this.config = {
      enabled: config?.enabled ?? true,
      historySize: config?.historySize ?? 1000,
      hotKeyLimit: config?.hotKeyLimit ?? 100,
      autoCalculatePercentiles: config?.autoCalculatePercentiles ?? true,
    }

    this.enabled = this.config.enabled
  }

  /**
   * 启用跟踪
   */
  enable(): void {
    this.enabled = true
  }

  /**
   * 禁用跟踪
   */
  disable(): void {
    this.enabled = false
  }

  /**
   * 开始跟踪操作
   * 
   * 返回一个函数，调用它来结束跟踪并记录耗时
   * 
   * @param operation - 操作名称（get、set、remove等）
   * @param metadata - 可选的元数据（如key、engine等）
   * @returns 结束跟踪的函数
   * 
   * @example
   * ```typescript
   * const endOp = tracker.startOperation('get')
   * try {
   *   await cache.get('key')
   * } finally {
   *   endOp()
   * }
   * ```
   */
  startOperation(
    operation: string,
    metadata?: Record<string, unknown>,
  ): () => void {
    if (!this.enabled) {
      return () => { } // 空函数，无开销
    }

    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordOperation(operation, duration, metadata)
    }
  }

  /**
   * 记录操作耗时
   * 
   * @param operation - 操作名称
   * @param duration - 耗时（毫秒）
   * @param metadata - 元数据
   */
  private recordOperation(
    operation: string,
    duration: number,
    metadata?: Record<string, unknown>,
  ): void {
    // 记录到历史
    const times = this.operationTimes.get(operation) || []
    times.push(duration)

    // 保持滚动窗口（最近N次记录）
    if (times.length > this.config.historySize) {
      times.shift()
    }
    this.operationTimes.set(operation, times)

    // 如果有键信息，更新热点分析
    if (metadata?.key && typeof metadata.key === 'string') {
      this.recordKeyAccess(metadata.key)
    }

    // 如果有引擎信息，更新引擎统计
    if (metadata?.engine && typeof metadata.engine === 'string') {
      this.recordEngineOperation(
        metadata.engine as StorageEngine,
        operation,
        duration,
      )
    }
  }

  /**
   * 记录键访问
   * 
   * @param key - 缓存键
   */
  private recordKeyAccess(key: string): void {
    // 更新访问计数
    this.keyAccessCount.set(
      key,
      (this.keyAccessCount.get(key) || 0) + 1,
    )

    // 记录访问时间戳
    const history = this.keyAccessHistory.get(key) || []
    history.push(Date.now())

    // 保持最近50次访问
    if (history.length > 50) {
      history.shift()
    }
    this.keyAccessHistory.set(key, history)

    // 限制热点键数量，避免内存无限增长
    if (this.keyAccessCount.size > this.config.hotKeyLimit) {
      this.pruneHotKeys()
    }
  }

  /**
   * 修剪热点键（删除访问次数最少的）
   */
  private pruneHotKeys(): void {
    // 按访问次数排序，删除后一半
    const sorted = Array.from(this.keyAccessCount.entries())
      .sort((a, b) => b[1] - a[1])

    const toKeep = sorted.slice(0, Math.floor(this.config.hotKeyLimit * 0.8))

    this.keyAccessCount.clear()
    this.keyAccessHistory.clear()

    for (const [key, count] of toKeep) {
      this.keyAccessCount.set(key, count)
    }
  }

  /**
   * 记录引擎操作
   * 
   * @param engine - 引擎类型
   * @param operation - 操作类型
   * @param duration - 耗时
   */
  private recordEngineOperation(
    engine: StorageEngine,
    operation: string,
    duration: number,
  ): void {
    const stats = this.engineStats.get(engine) || {
      readTimes: [],
      writeTimes: [],
    }

    // 判断是读操作还是写操作
    if (operation === 'get' || operation === 'mget' || operation === 'has') {
      stats.readTimes.push(duration)
      if (stats.readTimes.length > this.config.historySize) {
        stats.readTimes.shift()
      }
    }
    else if (operation === 'set' || operation === 'mset' || operation === 'remove') {
      stats.writeTimes.push(duration)
      if (stats.writeTimes.length > this.config.historySize) {
        stats.writeTimes.shift()
      }
    }

    this.engineStats.set(engine, stats)
  }

  /**
   * 记录内存使用
   * 
   * @param currentMemory - 当前内存使用量（字节）
   */
  recordMemoryUsage(currentMemory: number): void {
    if (!this.enabled) {
      return
    }

    this.memoryHistory.push(currentMemory)

    // 保持最近100个采样点
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift()
    }
  }

  /**
   * 设置内存限制
   * 
   * @param limit - 内存限制（字节）
   */
  setMemoryLimit(limit: number): void {
    this.memoryLimit = limit
  }

  /**
   * 计算操作统计
   * 
   * @param times - 耗时数组
   * @returns 操作统计
   */
  private calculateOperationStats(times: number[]): OperationStats {
    if (times.length === 0) {
      return {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      }
    }

    const sorted = [...times].sort((a, b) => a - b)
    const total = times.reduce((sum, t) => sum + t, 0)

    return {
      count: times.length,
      totalTime: total,
      avgTime: total / times.length,
      minTime: sorted[0],
      maxTime: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.50)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * 获取性能指标
   * 
   * @returns 完整的性能指标
   */
  getMetrics(): PerformanceMetrics {
    const now = Date.now()

    // 操作统计
    const operations = {
      get: this.calculateOperationStats(this.operationTimes.get('get') || []),
      set: this.calculateOperationStats(this.operationTimes.get('set') || []),
      remove: this.calculateOperationStats(this.operationTimes.get('remove') || []),
      mget: {
        ...this.calculateOperationStats(this.operationTimes.get('mget') || []),
        avgItemsPerOp: 0, // TODO: 需要额外跟踪
      },
      mset: {
        ...this.calculateOperationStats(this.operationTimes.get('mset') || []),
        avgItemsPerOp: 0, // TODO: 需要额外跟踪
      },
    }

    // 引擎性能统计
    const engines: Record<string, EnginePerformance> = {}
    for (const [engine, stats] of this.engineStats) {
      const readTotal = stats.readTimes.reduce((a, b) => a + b, 0)
      const writeTotal = stats.writeTimes.reduce((a, b) => a + b, 0)

      engines[engine] = {
        readTime: readTotal,
        writeTime: writeTotal,
        readCount: stats.readTimes.length,
        writeCount: stats.writeTimes.length,
        avgReadTime: stats.readTimes.length > 0 ? readTotal / stats.readTimes.length : 0,
        avgWriteTime: stats.writeTimes.length > 0 ? writeTotal / stats.writeTimes.length : 0,
      }
    }

    // 内存使用
    const currentMemory = this.memoryHistory[this.memoryHistory.length - 1] || 0
    const peakMemory = Math.max(...this.memoryHistory, 0)
    const utilization = this.memoryLimit > 0 ? currentMemory / this.memoryLimit : 0

    let pressure: MemoryUsage['pressure'] = 'low'
    if (utilization > 0.95) {
      pressure = 'critical'
    }
    else if (utilization > 0.8) {
      pressure = 'high'
    }
    else if (utilization > 0.6) {
      pressure = 'medium'
    }

    const memory: MemoryUsage = {
      current: currentMemory,
      peak: peakMemory,
      limit: this.memoryLimit,
      utilization,
      pressure,
    }

    // 缓存效率（需要外部提供数据，这里返回默认值）
    const efficiency: CacheEfficiency = {
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      serializationCacheHitRate: 0,
    }

    // 热点键
    const hotKeys = this.getHotKeys(10)

    return {
      operations,
      engines: engines as Record<StorageEngine, EnginePerformance>,
      memory,
      efficiency,
      hotKeys,
      timeRange: {
        start: this.startTime,
        end: now,
        duration: now - this.startTime,
      },
    }
  }

  /**
   * 获取热点键Top N
   * 
   * @param topN - 返回前N个热点键
   * @returns 热点键数组
   */
  getHotKeys(topN: number = 10): HotKey[] {
    return Array.from(this.keyAccessCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([key, accessCount]) => {
        const history = this.keyAccessHistory.get(key) || []
        const avgInterval = this.calculateAvgInterval(history)

        return {
          key,
          accessCount,
          lastAccess: history[history.length - 1] || 0,
          avgInterval,
        }
      })
  }

  /**
   * 计算平均访问间隔
   * 
   * @param timestamps - 时间戳数组
   * @returns 平均间隔（毫秒）
   */
  private calculateAvgInterval(timestamps: number[]): number | undefined {
    if (timestamps.length < 2) {
      return undefined
    }

    let totalInterval = 0
    for (let i = 1; i < timestamps.length; i++) {
      totalInterval += timestamps[i] - timestamps[i - 1]
    }

    return totalInterval / (timestamps.length - 1)
  }

  /**
   * 更新缓存效率统计
   * 
   * @param efficiency - 效率数据
   */
  updateEfficiency(efficiency: Partial<CacheEfficiency>): void {
    // 外部提供的效率数据将在getMetrics时合并
    // 这里可以存储到实例变量
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.operationTimes.clear()
    this.keyAccessCount.clear()
    this.keyAccessHistory.clear()
    this.engineStats.clear()
    this.memoryHistory = []
    this.startTime = Date.now()
  }

  /**
   * 生成性能报告
   * 
   * @returns 格式化的性能报告字符串
   */
  generateReport(): string {
    const metrics = this.getMetrics()
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('📊 缓存性能报告')
    lines.push('='.repeat(60))
    lines.push('')

    // 操作统计
    lines.push('⚡ 操作性能:')
    lines.push(`  GET:    ${metrics.operations.get.count} 次, 平均 ${metrics.operations.get.avgTime.toFixed(2)}ms, P95 ${metrics.operations.get.p95.toFixed(2)}ms`)
    lines.push(`  SET:    ${metrics.operations.set.count} 次, 平均 ${metrics.operations.set.avgTime.toFixed(2)}ms, P95 ${metrics.operations.set.p95.toFixed(2)}ms`)
    lines.push(`  REMOVE: ${metrics.operations.remove.count} 次, 平均 ${metrics.operations.remove.avgTime.toFixed(2)}ms`)
    lines.push('')

    // 引擎性能
    lines.push('🔧 引擎性能:')
    for (const [engine, perf] of Object.entries(metrics.engines)) {
      if (perf.readCount > 0 || perf.writeCount > 0) {
        lines.push(`  ${engine}:`)
        lines.push(`    读: ${perf.readCount} 次, 平均 ${perf.avgReadTime.toFixed(2)}ms`)
        lines.push(`    写: ${perf.writeCount} 次, 平均 ${perf.avgWriteTime.toFixed(2)}ms`)
      }
    }
    lines.push('')

    // 内存使用
    lines.push('💾 内存使用:')
    lines.push(`  当前: ${this.formatBytes(metrics.memory.current)}`)
    lines.push(`  峰值: ${this.formatBytes(metrics.memory.peak)}`)
    lines.push(`  限制: ${this.formatBytes(metrics.memory.limit)}`)
    lines.push(`  使用率: ${(metrics.memory.utilization * 100).toFixed(1)}%`)
    lines.push(`  压力: ${metrics.memory.pressure}`)
    lines.push('')

    // 热点键
    if (metrics.hotKeys.length > 0) {
      lines.push('🔥 热点键 Top 5:')
      metrics.hotKeys.slice(0, 5).forEach((hot, i) => {
        lines.push(`  ${i + 1}. ${hot.key}: ${hot.accessCount} 次访问`)
      })
      lines.push('')
    }

    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  /**
   * 格式化字节大小
   * 
   * @param bytes - 字节数
   * @returns 格式化字符串
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) {
      return '0 B'
    }

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  /**
   * 获取统计摘要
   * 
   * @returns 简化的统计摘要
   */
  getSummary(): {
    totalOperations: number
    avgOperationTime: number
    hotKeysCount: number
    memoryPressure: string
  } {
    const metrics = this.getMetrics()

    let totalOps = 0
    let totalTime = 0

    for (const op of Object.values(metrics.operations)) {
      totalOps += op.count
      totalTime += op.totalTime
    }

    return {
      totalOperations: totalOps,
      avgOperationTime: totalOps > 0 ? totalTime / totalOps : 0,
      hotKeysCount: this.keyAccessCount.size,
      memoryPressure: metrics.memory.pressure,
    }
  }
}


