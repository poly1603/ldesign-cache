/**
 * 性能监控插件
 * @module @ldesign/cache/core/plugins/performance
 */

import type { CachePlugin, CachePluginContext, SetOptions } from '../types'

/**
 * 性能指标
 */
export interface PerformanceMetric {
  /** 操作类型 */
  operation: 'get' | 'set' | 'delete' | 'clear' | 'has'
  /** 缓存键（如果适用） */
  key?: string
  /** 操作耗时（毫秒） */
  duration: number
  /** 时间戳 */
  timestamp: number
  /** 操作是否成功 */
  success: boolean
  /** 是否命中缓存（仅 get 操作） */
  hit?: boolean
  /** 值大小估算（字节） */
  valueSize?: number
}

/**
 * 性能统计摘要
 */
export interface PerformanceStats {
  /** 操作总数 */
  totalOperations: number
  /** 各操作类型的统计 */
  byOperation: Record<string, OperationStats>
  /** 总耗时 */
  totalDuration: number
  /** 平均耗时 */
  avgDuration: number
  /** 最大耗时 */
  maxDuration: number
  /** 最小耗时 */
  minDuration: number
  /** P50 耗时 */
  p50Duration: number
  /** P95 耗时 */
  p95Duration: number
  /** P99 耗时 */
  p99Duration: number
  /** 慢操作次数 */
  slowOperations: number
  /** 开始时间 */
  startTime: number
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 单个操作类型的统计
 */
export interface OperationStats {
  /** 操作次数 */
  count: number
  /** 总耗时 */
  totalDuration: number
  /** 平均耗时 */
  avgDuration: number
  /** 最大耗时 */
  maxDuration: number
  /** 最小耗时 */
  minDuration: number
  /** 成功次数 */
  successCount: number
  /** 失败次数 */
  failureCount: number
}

/**
 * 性能监控插件选项
 */
export interface PerformancePluginOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 慢操作阈值（毫秒），默认 100ms */
  slowThreshold?: number
  /** 最大保留的指标数量，默认 1000 */
  maxMetrics?: number
  /** 采样率（0-1），默认 1.0（全量采集） */
  samplingRate?: number
  /** 慢操作回调 */
  onSlowOperation?: (metric: PerformanceMetric) => void
  /** 指标记录回调（用于外部上报） */
  onMetric?: (metric: PerformanceMetric) => void
}

/**
 * 性能监控插件
 * 
 * 追踪缓存操作的性能指标，支持：
 * - 操作耗时追踪
 * - 慢操作检测
 * - 性能统计分析
 * - 指标采样
 * - 外部上报
 * 
 * @example
 * ```typescript
 * const performancePlugin = new PerformancePlugin({
 *   slowThreshold: 50,
 *   onSlowOperation: (metric) => {
 *     console.warn('慢操作:', metric)
 *   }
 * })
 * 
 * const cache = new CacheManager({
 *   plugins: [performancePlugin]
 * })
 * 
 * // 获取性能统计
 * const stats = performancePlugin.getStats()
 * console.log('平均耗时:', stats.avgDuration)
 * ```
 */
export class PerformancePlugin<T = unknown> implements CachePlugin<T> {
  readonly name = 'performance'
  readonly version = '1.0.0'

  private options: Required<PerformancePluginOptions>
  private metrics: PerformanceMetric[] = []
  private operationStarts = new Map<string, number>()
  private startTime = Date.now()

  constructor(options: PerformancePluginOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      slowThreshold: options.slowThreshold ?? 100,
      maxMetrics: options.maxMetrics ?? 1000,
      samplingRate: options.samplingRate ?? 1.0,
      onSlowOperation: options.onSlowOperation ?? (() => {}),
      onMetric: options.onMetric ?? (() => {}),
    }
  }

  /**
   * 插件初始化
   */
  init(_cache: CachePluginContext<T>): void {
    this.startTime = Date.now()
    this.metrics = []
  }

  /**
   * 在获取缓存前记录开始时间
   */
  beforeGet(key: string): void {
    if (this.shouldSample()) {
      this.operationStarts.set(`get:${key}`, performance.now())
    }
  }

  /**
   * 在获取缓存后记录指标
   */
  afterGet(key: string, value: T | undefined): void {
    const startKey = `get:${key}`
    const startTime = this.operationStarts.get(startKey)
    
    if (startTime !== undefined) {
      this.operationStarts.delete(startKey)
      this.recordMetric({
        operation: 'get',
        key,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success: true,
        hit: value !== undefined,
      })
    }
  }

  /**
   * 在设置缓存前记录开始时间
   */
  beforeSet(key: string, value: T, _options?: SetOptions): void {
    if (this.shouldSample()) {
      this.operationStarts.set(`set:${key}`, performance.now())
    }
  }

  /**
   * 在设置缓存后记录指标
   */
  afterSet(key: string, value: T, _options?: SetOptions): void {
    const startKey = `set:${key}`
    const startTime = this.operationStarts.get(startKey)
    
    if (startTime !== undefined) {
      this.operationStarts.delete(startKey)
      this.recordMetric({
        operation: 'set',
        key,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success: true,
        valueSize: this.estimateSize(value),
      })
    }
  }

  /**
   * 在删除缓存前记录开始时间
   */
  beforeDelete(key: string): void {
    if (this.shouldSample()) {
      this.operationStarts.set(`delete:${key}`, performance.now())
    }
  }

  /**
   * 在删除缓存后记录指标
   */
  afterDelete(key: string, success: boolean): void {
    const startKey = `delete:${key}`
    const startTime = this.operationStarts.get(startKey)
    
    if (startTime !== undefined) {
      this.operationStarts.delete(startKey)
      this.recordMetric({
        operation: 'delete',
        key,
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success,
      })
    }
  }

  /**
   * 在清空缓存前记录开始时间
   */
  beforeClear(): void {
    if (this.shouldSample()) {
      this.operationStarts.set('clear', performance.now())
    }
  }

  /**
   * 在清空缓存后记录指标
   */
  afterClear(): void {
    const startTime = this.operationStarts.get('clear')
    
    if (startTime !== undefined) {
      this.operationStarts.delete('clear')
      this.recordMetric({
        operation: 'clear',
        duration: performance.now() - startTime,
        timestamp: Date.now(),
        success: true,
      })
    }
  }

  /**
   * 记录性能指标
   */
  private recordMetric(metric: PerformanceMetric): void {
    if (!this.options.enabled) {
      return
    }

    // 添加指标
    this.metrics.push(metric)

    // 限制指标数量
    if (this.metrics.length > this.options.maxMetrics) {
      this.metrics.shift()
    }

    // 检测慢操作
    if (metric.duration > this.options.slowThreshold) {
      this.options.onSlowOperation(metric)
    }

    // 外部上报
    this.options.onMetric(metric)
  }

  /**
   * 是否应该采样
   */
  private shouldSample(): boolean {
    if (!this.options.enabled) {
      return false
    }
    return Math.random() < this.options.samplingRate
  }

  /**
   * 估算值的大小（字节）
   */
  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2 // UTF-16 编码
    }
    catch {
      return 0
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * 获取性能统计摘要
   */
  getStats(): PerformanceStats {
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b)
    const byOperation: Record<string, OperationStats> = {}

    // 按操作类型分组统计
    for (const metric of this.metrics) {
      const op = metric.operation
      if (!byOperation[op]) {
        byOperation[op] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          maxDuration: 0,
          minDuration: Infinity,
          successCount: 0,
          failureCount: 0,
        }
      }

      const stats = byOperation[op]
      stats.count++
      stats.totalDuration += metric.duration
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration)
      stats.minDuration = Math.min(stats.minDuration, metric.duration)

      if (metric.success) {
        stats.successCount++
      }
      else {
        stats.failureCount++
      }
    }

    // 计算各操作类型的平均值
    for (const stats of Object.values(byOperation)) {
      stats.avgDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0
      if (stats.minDuration === Infinity) {
        stats.minDuration = 0
      }
    }

    const totalDuration = durations.reduce((sum, d) => sum + d, 0)
    const slowOperations = this.metrics.filter(
      m => m.duration > this.options.slowThreshold,
    ).length

    return {
      totalOperations: this.metrics.length,
      byOperation,
      totalDuration,
      avgDuration: durations.length > 0 ? totalDuration / durations.length : 0,
      maxDuration: durations.length > 0 ? durations[durations.length - 1] : 0,
      minDuration: durations.length > 0 ? durations[0] : 0,
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
      slowOperations,
      startTime: this.startTime,
      lastUpdated: Date.now(),
    }
  }

  /**
   * 计算百分位数
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) {
      return 0
    }
    const index = Math.ceil((p / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))]
  }

  /**
   * 获取慢操作列表
   */
  getSlowOperations(): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > this.options.slowThreshold)
  }

  /**
   * 获取命中率统计（仅 get 操作）
   */
  getHitRate(): { total: number, hits: number, misses: number, rate: number } {
    const getMetrics = this.metrics.filter(m => m.operation === 'get')
    const hits = getMetrics.filter(m => m.hit === true).length
    const misses = getMetrics.filter(m => m.hit === false).length

    return {
      total: getMetrics.length,
      hits,
      misses,
      rate: getMetrics.length > 0 ? hits / getMetrics.length : 0,
    }
  }

  /**
   * 重置统计数据
   */
  reset(): void {
    this.metrics = []
    this.operationStarts.clear()
    this.startTime = Date.now()
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const stats = this.getStats()
    const hitRate = this.getHitRate()

    const lines = [
      '=== 缓存性能报告 ===',
      '',
      `运行时长: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`,
      `总操作数: ${stats.totalOperations}`,
      '',
      '--- 耗时统计 ---',
      `平均耗时: ${stats.avgDuration.toFixed(3)}ms`,
      `最小耗时: ${stats.minDuration.toFixed(3)}ms`,
      `最大耗时: ${stats.maxDuration.toFixed(3)}ms`,
      `P50: ${stats.p50Duration.toFixed(3)}ms`,
      `P95: ${stats.p95Duration.toFixed(3)}ms`,
      `P99: ${stats.p99Duration.toFixed(3)}ms`,
      '',
      `慢操作 (>${this.options.slowThreshold}ms): ${stats.slowOperations}`,
      '',
      '--- 命中率 ---',
      `总查询: ${hitRate.total}`,
      `命中: ${hitRate.hits}`,
      `未命中: ${hitRate.misses}`,
      `命中率: ${(hitRate.rate * 100).toFixed(2)}%`,
      '',
      '--- 操作类型统计 ---',
    ]

    for (const [op, opStats] of Object.entries(stats.byOperation)) {
      lines.push(
        `${op}: ${opStats.count} 次, 平均 ${opStats.avgDuration.toFixed(3)}ms, ` +
        `成功 ${opStats.successCount}, 失败 ${opStats.failureCount}`,
      )
    }

    return lines.join('\n')
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    this.metrics = []
    this.operationStarts.clear()
  }
}

/**
 * 创建性能监控插件
 * @param options - 插件选项
 * @returns 性能监控插件实例
 */
export function createPerformancePlugin<T = unknown>(
  options?: PerformancePluginOptions,
): PerformancePlugin<T> {
  return new PerformancePlugin<T>(options)
}
