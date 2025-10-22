/**
 * 性能分析器（Performance Profiler）
 * 
 * 提供详细的性能分析、热点识别和优化建议
 */

import type { CacheManager } from '../core/cache-manager'

/**
 * 操作性能记录
 */
interface OperationRecord {
  operation: string
  duration: number
  timestamp: number
  key?: string
  engine?: string
  success: boolean
}

/**
 * 性能分析结果
 */
export interface PerformanceAnalysis {
  /** 总操作数 */
  totalOperations: number
  /** 平均耗时 */
  averageDuration: number
  /** 中位数耗时 */
  medianDuration: number
  /** P95 耗时 */
  p95Duration: number
  /** P99 耗时 */
  p99Duration: number
  /** 最慢的操作 */
  slowestOperations: OperationRecord[]
  /** 按操作类型统计 */
  byOperation: Record<string, {
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
  }>
  /** 按引擎统计 */
  byEngine: Record<string, {
    count: number
    avgDuration: number
  }>
}

/**
 * 性能分析器配置
 */
export interface ProfilerOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 最大记录数 */
  maxRecords?: number
  /** 慢操作阈值（毫秒） */
  slowThreshold?: number
  /** 采样率（0-1） */
  samplingRate?: number
}

/**
 * 性能分析器
 */
export class PerformanceProfiler {
  private records: OperationRecord[] = []
  private readonly maxRecords: number
  private readonly slowThreshold: number
  private readonly samplingRate: number
  private enabled: boolean

  constructor(
    private cache: CacheManager,
    options: ProfilerOptions = {},
  ) {
    this.maxRecords = options.maxRecords || 1000
    this.slowThreshold = options.slowThreshold || 100
    this.samplingRate = options.samplingRate || 1.0
    this.enabled = options.enabled ?? true

    if (this.enabled) {
      this.setupHooks()
    }
  }

  /**
   * 设置钩子
   */
  private setupHooks(): void {
    const operations = ['set', 'get', 'remove', 'clear']

    for (const operation of operations) {
      this.cache.on(operation as any, (event) => {
        // 采样
        if (Math.random() > this.samplingRate) {
          return
        }

        // 这里记录的是操作完成后的事件
        // 实际的性能监控应该在操作前后包裹
        // 这里仅作为示例
      })
    }
  }

  /**
   * 记录操作
   */
  record(
    operation: string,
    duration: number,
    options: {
      key?: string
      engine?: string
      success?: boolean
    } = {},
  ): void {
    if (!this.enabled) {
      return
    }

    const record: OperationRecord = {
      operation,
      duration,
      timestamp: Date.now(),
      key: options.key,
      engine: options.engine,
      success: options.success ?? true,
    }

    this.records.push(record)

    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }

    // 慢操作警告
    if (duration > this.slowThreshold) {
      console.warn(`[Profiler] Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
    }
  }

  /**
   * 测量操作
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: { key?: string, engine?: string },
  ): Promise<T> {
    const start = performance.now()
    let success = true

    try {
      return await fn()
    }
    catch (error) {
      success = false
      throw error
    }
    finally {
      const duration = performance.now() - start
      this.record(operation, duration, { ...metadata, success })
    }
  }

  /**
   * 分析性能
   */
  analyze(): PerformanceAnalysis {
    if (this.records.length === 0) {
      return this.getEmptyAnalysis()
    }

    const durations = this.records.map(r => r.duration).sort((a, b) => a - b)
    const totalDuration = durations.reduce((sum, d) => sum + d, 0)

    // 计算百分位数
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)
    const medianIndex = Math.floor(durations.length * 0.5)

    // 按操作类型统计
    const byOperation: Record<string, {
      count: number
      avgDuration: number
      minDuration: number
      maxDuration: number
    }> = {}

    for (const record of this.records) {
      if (!byOperation[record.operation]) {
        byOperation[record.operation] = {
          count: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
        }
      }

      const stats = byOperation[record.operation]
      stats.count++
      stats.avgDuration = (stats.avgDuration * (stats.count - 1) + record.duration) / stats.count
      stats.minDuration = Math.min(stats.minDuration, record.duration)
      stats.maxDuration = Math.max(stats.maxDuration, record.duration)
    }

    // 按引擎统计
    const byEngine: Record<string, { count: number, avgDuration: number }> = {}

    for (const record of this.records.filter(r => r.engine)) {
      const engine = record.engine!
      if (!byEngine[engine]) {
        byEngine[engine] = { count: 0, avgDuration: 0 }
      }

      byEngine[engine].count++
      byEngine[engine].avgDuration =
        (byEngine[engine].avgDuration * (byEngine[engine].count - 1) + record.duration) / byEngine[engine].count
    }

    return {
      totalOperations: this.records.length,
      averageDuration: totalDuration / this.records.length,
      medianDuration: durations[medianIndex],
      p95Duration: durations[p95Index],
      p99Duration: durations[p99Index],
      slowestOperations: this.records
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      byOperation,
      byEngine,
    }
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const analysis = this.analyze()

    let report = '=== Performance Analysis Report ===\n\n'

    report += `Overview:\n`
    report += `  Total Operations: ${analysis.totalOperations}\n`
    report += `  Average Duration: ${analysis.averageDuration.toFixed(2)}ms\n`
    report += `  Median Duration: ${analysis.medianDuration.toFixed(2)}ms\n`
    report += `  P95 Duration: ${analysis.p95Duration.toFixed(2)}ms\n`
    report += `  P99 Duration: ${analysis.p99Duration.toFixed(2)}ms\n\n`

    report += `By Operation:\n`
    for (const [op, stats] of Object.entries(analysis.byOperation)) {
      report += `  ${op}:\n`
      report += `    Count: ${stats.count}\n`
      report += `    Avg: ${stats.avgDuration.toFixed(2)}ms\n`
      report += `    Min: ${stats.minDuration.toFixed(2)}ms\n`
      report += `    Max: ${stats.maxDuration.toFixed(2)}ms\n`
    }
    report += '\n'

    if (Object.keys(analysis.byEngine).length > 0) {
      report += `By Engine:\n`
      for (const [engine, stats] of Object.entries(analysis.byEngine)) {
        report += `  ${engine}: ${stats.count} ops, avg ${stats.avgDuration.toFixed(2)}ms\n`
      }
      report += '\n'
    }

    if (analysis.slowestOperations.length > 0) {
      report += `Slowest Operations (Top 10):\n`
      for (const op of analysis.slowestOperations.slice(0, 10)) {
        report += `  ${op.operation}`
        if (op.key) report += ` [${op.key}]`
        report += `: ${op.duration.toFixed(2)}ms\n`
      }
    }

    return report
  }

  /**
   * 清空记录
   */
  clear(): void {
    this.records = []
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 获取空分析结果
   */
  private getEmptyAnalysis(): PerformanceAnalysis {
    return {
      totalOperations: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      slowestOperations: [],
      byOperation: {},
      byEngine: {},
    }
  }
}

/**
 * 创建性能分析器
 */
export function createPerformanceProfiler(
  cache: CacheManager,
  options?: ProfilerOptions,
): PerformanceProfiler {
  return new PerformanceProfiler(cache, options)
}

/**
 * 性能测量装饰器
 */
export function measurePerformance(profiler: PerformanceProfiler, operation: string) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (this: any, ...args: any[]) {
      return profiler.measure(operation, () => originalMethod.apply(this, args))
    }

    return descriptor
  }
}

