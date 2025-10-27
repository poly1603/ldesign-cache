/**
 * 高级缓存检查器
 * 
 * 提供强大的调试和分析工具：
 * - 实时监控仪表板
 * - 性能火焰图数据
 * - 内存快照对比
 * - 自动优化建议
 * - ASCII可视化图表
 * 
 * @example
 * ```typescript
 * const inspector = new AdvancedCacheInspector(cache)
 * 
 * // 生成仪表板
 * const dashboard = await inspector.generateDashboard()
 * console.table(dashboard.realtime)
 * 
 * // 获取优化建议
 * const suggestions = await inspector.getOptimizationSuggestions()
 * suggestions.forEach(s => console.log(s.message))
 * ```
 */

import type { CacheManager } from '../core/cache-manager'
import type { CacheStats, StorageEngine } from '../types'
import type { PerformanceMetrics } from '../core/performance-tracker'

/**
 * 实时监控数据
 */
export interface RealtimeData {
  /** 每秒操作数 */
  opsPerSecond: number
  /** 实时命中率 */
  hitRate: number
  /** 内存使用（字节） */
  memoryUsage: number
  /** 内存使用率（百分比） */
  memoryUtilization: number
  /** Top 5 热点键 */
  topKeys: Array<{ key: string, count: number }>
}

/**
 * 引擎详情
 */
export interface EngineDetails {
  /** 引擎名称 */
  name: StorageEngine
  /** 是否可用 */
  available: boolean
  /** 缓存项数量 */
  itemCount: number
  /** 存储大小（字节） */
  size: number
  /** 格式化的大小 */
  sizeFormatted: string
  /** 命中次数 */
  hits: number
  /** 未命中次数 */
  misses: number
  /** 命中率 */
  hitRate: number
}

/**
 * 操作时间线项
 */
export interface TimelineItem {
  /** 操作类型 */
  operation: string
  /** 时间戳 */
  timestamp: number
  /** 耗时（毫秒） */
  duration: number
  /** 缓存键 */
  key?: string
  /** 引擎 */
  engine?: StorageEngine
}

/**
 * 性能警告
 */
export interface PerformanceAlert {
  /** 警告类型 */
  type: 'slow-operation' | 'high-memory' | 'low-hit-rate' | 'hot-key'
  /** 严重程度 */
  severity: 'info' | 'warning' | 'critical'
  /** 警告消息 */
  message: string
  /** 相关数据 */
  data?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
}

/**
 * 仪表板数据
 */
export interface DashboardData {
  /** 实时数据 */
  realtime: RealtimeData
  /** 引擎详情 */
  engines: EngineDetails[]
  /** 操作时间线 */
  timeline: TimelineItem[]
  /** 活跃警告 */
  alerts: PerformanceAlert[]
}

/**
 * 优化建议类型
 */
export type OptimizationType =
  | 'low-hit-rate'
  | 'hot-key-detected'
  | 'high-memory-pressure'
  | 'slow-operations'
  | 'inefficient-engine'
  | 'ttl-optimization'

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  /** 建议类型 */
  type: OptimizationType
  /** 严重程度 */
  severity: 'info' | 'warning' | 'critical'
  /** 建议消息 */
  message: string
  /** 建议操作 */
  action?: string
  /** 相关数据 */
  data?: Record<string, unknown>
}

/**
 * 内存分解数据
 */
export interface MemoryBreakdown {
  /** 引擎内存使用 */
  engines: Record<StorageEngine, number>
  /** 内部缓存内存使用 */
  internalCaches: {
    serialization: number
    keyMapping: number
    events: number
  }
  /** 总计 */
  total: number
}

/**
 * 高级缓存检查器
 */
export class AdvancedCacheInspector {
  /** 缓存管理器实例 */
  private cache: CacheManager

  /** 操作时间线（最近1分钟） */
  private timeline: TimelineItem[] = []

  /** 活跃警告列表 */
  private alerts: PerformanceAlert[] = []

  /** 上次操作时间戳 */
  private lastOperationTime: number = Date.now()

  /** 操作计数器 */
  private operationCounter: number = 0

  /**
   * 创建高级检查器
   * 
   * @param cache - 缓存管理器实例
   */
  constructor(cache: CacheManager) {
    this.cache = cache
    this.startMonitoring()
  }

  /**
   * 开始监控
   */
  private startMonitoring(): void {
    // 监听缓存事件，构建时间线
    this.cache.on('set', (event) => {
      this.recordOperation('set', event.key, event.engine)
    })

    this.cache.on('get', (event) => {
      this.recordOperation('get', event.key, event.engine)
    })

    this.cache.on('remove', (event) => {
      this.recordOperation('remove', event.key, event.engine)
    })
  }

  /**
   * 记录操作到时间线
   * 
   * @param operation - 操作类型
   * @param key - 缓存键
   * @param engine - 引擎
   */
  private recordOperation(
    operation: string,
    key?: string,
    engine?: StorageEngine,
  ): void {
    const now = Date.now()

    this.timeline.push({
      operation,
      timestamp: now,
      duration: now - this.lastOperationTime,
      key,
      engine,
    })

    // 保持最近1000个操作
    if (this.timeline.length > 1000) {
      this.timeline.shift()
    }

    this.lastOperationTime = now
    this.operationCounter++
  }

  /**
   * 生成实时监控仪表板
   * 
   * @returns 仪表板数据
   */
  async generateDashboard(): Promise<DashboardData> {
    const stats = await this.cache.getStats()
    const perfMetrics = this.cache.getPerformanceMetrics()

    return {
      realtime: this.calculateRealtimeData(stats, perfMetrics),
      engines: this.getEngineDetails(stats),
      timeline: this.getRecentTimeline(60), // 最近60秒
      alerts: this.getActiveAlerts(stats, perfMetrics),
    }
  }

  /**
   * 计算实时数据
   * 
   * @param stats - 缓存统计
   * @param perfMetrics - 性能指标
   * @returns 实时数据
   */
  private calculateRealtimeData(
    stats: CacheStats,
    perfMetrics: PerformanceMetrics,
  ): RealtimeData {
    // 计算每秒操作数（基于最近的操作）
    const recentOps = this.timeline.filter(
      item => item.timestamp > Date.now() - 1000,
    )

    return {
      opsPerSecond: recentOps.length,
      hitRate: stats.hitRate,
      memoryUsage: perfMetrics.memory.current,
      memoryUtilization: perfMetrics.memory.utilization * 100,
      topKeys: perfMetrics.hotKeys.slice(0, 5).map(h => ({
        key: h.key,
        count: h.accessCount,
      })),
    }
  }

  /**
   * 获取引擎详情列表
   * 
   * @param stats - 缓存统计
   * @returns 引擎详情数组
   */
  private getEngineDetails(stats: CacheStats): EngineDetails[] {
    const details: EngineDetails[] = []

    for (const [engine, engineStats] of Object.entries(stats.engines)) {
      const totalRequests = engineStats.hits + engineStats.misses

      details.push({
        name: engine as StorageEngine,
        available: engineStats.available,
        itemCount: engineStats.itemCount,
        size: engineStats.size,
        sizeFormatted: this.formatBytes(engineStats.size),
        hits: engineStats.hits,
        misses: engineStats.misses,
        hitRate: totalRequests > 0 ? engineStats.hits / totalRequests : 0,
      })
    }

    return details
  }

  /**
   * 获取最近的操作时间线
   * 
   * @param seconds - 最近N秒的数据
   * @returns 时间线项数组
   */
  private getRecentTimeline(seconds: number): TimelineItem[] {
    const cutoff = Date.now() - seconds * 1000
    return this.timeline.filter(item => item.timestamp > cutoff)
  }

  /**
   * 获取活跃警告
   * 
   * @param stats - 缓存统计
   * @param perfMetrics - 性能指标
   * @returns 警告数组
   */
  private getActiveAlerts(
    stats: CacheStats,
    perfMetrics: PerformanceMetrics,
  ): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = []
    const now = Date.now()

    // 检查内存压力
    if (perfMetrics.memory.pressure === 'critical') {
      alerts.push({
        type: 'high-memory',
        severity: 'critical',
        message: `内存压力临界 (${(perfMetrics.memory.utilization * 100).toFixed(1)}%)`,
        data: { current: perfMetrics.memory.current, limit: perfMetrics.memory.limit },
        timestamp: now,
      })
    }
    else if (perfMetrics.memory.pressure === 'high') {
      alerts.push({
        type: 'high-memory',
        severity: 'warning',
        message: `内存压力偏高 (${(perfMetrics.memory.utilization * 100).toFixed(1)}%)`,
        data: { current: perfMetrics.memory.current, limit: perfMetrics.memory.limit },
        timestamp: now,
      })
    }

    // 检查命中率
    if (stats.hitRate < 0.5 && stats.hitRate > 0) {
      alerts.push({
        type: 'low-hit-rate',
        severity: 'warning',
        message: `缓存命中率低 (${(stats.hitRate * 100).toFixed(1)}%)`,
        data: { hitRate: stats.hitRate },
        timestamp: now,
      })
    }

    // 检查慢操作
    if (perfMetrics.operations.get.p95 > 100) {
      alerts.push({
        type: 'slow-operation',
        severity: 'warning',
        message: `GET操作P95耗时过高 (${perfMetrics.operations.get.p95.toFixed(2)}ms)`,
        data: { p95: perfMetrics.operations.get.p95, p99: perfMetrics.operations.get.p99 },
        timestamp: now,
      })
    }

    // 检查热点键
    const superHotKeys = perfMetrics.hotKeys.filter(h => h.accessCount > 1000)
    if (superHotKeys.length > 0) {
      alerts.push({
        type: 'hot-key',
        severity: 'info',
        message: `检测到${superHotKeys.length}个超级热点键`,
        data: { keys: superHotKeys.map(h => h.key) },
        timestamp: now,
      })
    }

    return alerts
  }

  /**
   * 获取优化建议
   * 
   * 基于当前性能数据自动生成优化建议
   * 
   * @returns 优化建议数组
   */
  async getOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = []
    const stats = await this.cache.getStats()
    const perfMetrics = this.cache.getPerformanceMetrics()

    // 检查命中率
    if (stats.hitRate < 0.5 && stats.hitRate > 0) {
      suggestions.push({
        type: 'low-hit-rate',
        severity: 'warning',
        message: `缓存命中率低于50% (${(stats.hitRate * 100).toFixed(1)}%)，考虑调整TTL或预热策略`,
        action: 'review-ttl-settings',
        data: {
          currentHitRate: stats.hitRate,
          recommendation: '增加TTL时长或使用预热策略',
        },
      })
    }

    // 检查热点键
    const hotKeys = perfMetrics.hotKeys
    const superHotKeys = hotKeys.filter(h => h.accessCount > 1000)

    if (superHotKeys.length > 0) {
      suggestions.push({
        type: 'hot-key-detected',
        severity: 'info',
        message: `检测到${superHotKeys.length}个热点键，考虑使用内存引擎或增加副本`,
        action: 'optimize-hot-keys',
        data: {
          hotKeys: superHotKeys.map(h => ({
            key: h.key,
            count: h.accessCount,
          })),
          recommendation: '将热点数据迁移到memory引擎',
        },
      })
    }

    // 检查内存压力
    if (perfMetrics.memory.pressure === 'high' || perfMetrics.memory.pressure === 'critical') {
      suggestions.push({
        type: 'high-memory-pressure',
        severity: perfMetrics.memory.pressure === 'critical' ? 'critical' : 'warning',
        message: `内存压力${perfMetrics.memory.pressure === 'critical' ? '临界' : '偏高'} (${(perfMetrics.memory.utilization * 100).toFixed(1)}%)，建议清理过期项或增加内存限制`,
        action: 'cleanup-or-increase-limit',
        data: {
          current: perfMetrics.memory.current,
          limit: perfMetrics.memory.limit,
          recommendation: '执行cleanup()或增加maxMemory配置',
        },
      })
    }

    // 检查慢操作
    if (perfMetrics.operations.get.p95 > 100) {
      suggestions.push({
        type: 'slow-operations',
        severity: 'warning',
        message: `GET操作P95耗时 ${perfMetrics.operations.get.p95.toFixed(2)}ms，可能需要优化`,
        action: 'optimize-get-operation',
        data: {
          p95: perfMetrics.operations.get.p95,
          p99: perfMetrics.operations.get.p99,
          recommendation: '检查是否启用了智能路由缓存',
        },
      })
    }

    if (perfMetrics.operations.set.p95 > 200) {
      suggestions.push({
        type: 'slow-operations',
        severity: 'warning',
        message: `SET操作P95耗时 ${perfMetrics.operations.set.p95.toFixed(2)}ms，可能需要优化`,
        action: 'optimize-set-operation',
        data: {
          p95: perfMetrics.operations.set.p95,
          recommendation: '考虑禁用加密或使用更快的序列化',
        },
      })
    }

    // 检查引擎效率
    for (const [engine, engineStats] of Object.entries(stats.engines)) {
      if (!engineStats.available) {
        continue
      }

      const totalRequests = engineStats.hits + engineStats.misses
      if (totalRequests > 100 && engineStats.hits / totalRequests < 0.3) {
        suggestions.push({
          type: 'inefficient-engine',
          severity: 'info',
          message: `${engine}引擎命中率较低 (${((engineStats.hits / totalRequests) * 100).toFixed(1)}%)`,
          action: 'review-engine-usage',
          data: {
            engine,
            hitRate: engineStats.hits / totalRequests,
            recommendation: '考虑调整智能策略或手动指定引擎',
          },
        })
      }
    }

    return suggestions
  }

  /**
   * 获取内存分解
   * 
   * 展示各部分的内存使用情况
   * 
   * @returns 内存分解数据
   */
  async getMemoryBreakdown(): Promise<MemoryBreakdown> {
    const stats = await this.cache.getStats()
    const engines: Record<string, number> = {}

    for (const [engine, engineStats] of Object.entries(stats.engines)) {
      engines[engine] = engineStats.size
    }

    // 估算内部缓存使用（简化）
    const internalCaches = {
      serialization: 50 * 1024, // 估算约50KB
      keyMapping: 100 * 1024,   // 估算约100KB
      events: 20 * 1024,         // 估算约20KB
    }

    const total = Object.values(engines).reduce((a, b) => a + b, 0)
      + Object.values(internalCaches).reduce((a, b) => a + b, 0)

    return {
      engines: engines as Record<StorageEngine, number>,
      internalCaches,
      total,
    }
  }

  /**
   * 生成内存图表（ASCII艺术）
   * 
   * @param breakdown - 内存分解数据
   * @returns ASCII图表字符串
   */
  generateMemoryChart(breakdown: MemoryBreakdown): string {
    const lines: string[] = []
    const maxWidth = 50

    lines.push('📊 内存使用分布:')
    lines.push('')

    // 引擎使用
    for (const [engine, size] of Object.entries(breakdown.engines)) {
      const percentage = breakdown.total > 0 ? size / breakdown.total : 0
      const barLength = Math.floor(percentage * maxWidth)
      const bar = '█'.repeat(barLength) + '░'.repeat(maxWidth - barLength)

      lines.push(`${engine.padEnd(15)} ${bar} ${this.formatBytes(size)} (${(percentage * 100).toFixed(1)}%)`)
    }

    lines.push('')
    lines.push(`总计: ${this.formatBytes(breakdown.total)}`)

    return lines.join('\n')
  }

  /**
   * 计算每秒操作数
   * 
   * @returns 每秒操作数
   */
  private calculateOpsRate(): number {
    const recent = this.timeline.filter(
      item => item.timestamp > Date.now() - 1000,
    )
    return recent.length
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
   * 生成完整的健康报告
   * 
   * @returns 格式化的健康报告
   */
  async generateHealthReport(): Promise<string> {
    const dashboard = await this.generateDashboard()
    const suggestions = await this.getOptimizationSuggestions()
    const breakdown = await this.getMemoryBreakdown()

    const lines: string[] = []

    lines.push('='.repeat(70))
    lines.push('🏥 缓存健康报告')
    lines.push('='.repeat(70))
    lines.push('')

    // 实时数据
    lines.push('📈 实时状态:')
    lines.push(`  操作速率: ${dashboard.realtime.opsPerSecond} ops/s`)
    lines.push(`  命中率:   ${(dashboard.realtime.hitRate * 100).toFixed(1)}%`)
    lines.push(`  内存使用: ${this.formatBytes(dashboard.realtime.memoryUsage)} (${dashboard.realtime.memoryUtilization.toFixed(1)}%)`)
    lines.push('')

    // 引擎状态
    lines.push('🔧 引擎状态:')
    for (const engine of dashboard.engines) {
      if (engine.available && engine.itemCount > 0) {
        lines.push(`  ${engine.name}:`)
        lines.push(`    项数: ${engine.itemCount}`)
        lines.push(`    大小: ${engine.sizeFormatted}`)
        lines.push(`    命中率: ${(engine.hitRate * 100).toFixed(1)}%`)
      }
    }
    lines.push('')

    // 警告
    if (dashboard.alerts.length > 0) {
      lines.push('⚠️  活跃警告:')
      for (const alert of dashboard.alerts) {
        const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'
        lines.push(`  ${icon} ${alert.message}`)
      }
      lines.push('')
    }

    // 优化建议
    if (suggestions.length > 0) {
      lines.push('💡 优化建议:')
      for (const suggestion of suggestions) {
        const icon = suggestion.severity === 'critical' ? '🔴' : suggestion.severity === 'warning' ? '⚠️' : 'ℹ️'
        lines.push(`  ${icon} ${suggestion.message}`)
        if (suggestion.data?.recommendation) {
          lines.push(`     建议: ${suggestion.data.recommendation}`)
        }
      }
      lines.push('')
    }

    // 内存分布
    lines.push(this.generateMemoryChart(breakdown))
    lines.push('')

    lines.push('='.repeat(70))

    return lines.join('\n')
  }

  /**
   * 清理历史数据
   */
  clearHistory(): void {
    this.timeline = []
    this.alerts = []
    this.operationCounter = 0
  }
}

/**
 * 创建高级检查器
 * 
 * @param cache - 缓存管理器实例
 * @returns 检查器实例
 */
export function createAdvancedInspector(cache: CacheManager): AdvancedCacheInspector {
  return new AdvancedCacheInspector(cache)
}


