/**
 * 缓存检查器（DevTools）
 * 
 * 提供实时的缓存内容查看、引擎状态监控和性能可视化
 */

import type { CacheManager } from '../core/cache-manager'
import type { CacheStats, StorageEngine } from '../types'

/**
 * 检查器配置
 */
export interface InspectorOptions {
  /** 是否自动刷新 */
  autoRefresh?: boolean
  /** 刷新间隔（毫秒） */
  refreshInterval?: number
  /** 是否在控制台输出 */
  logToConsole?: boolean
}

/**
 * 缓存项详情
 */
export interface CacheItemDetail {
  key: string
  value: any
  engine: StorageEngine
  size: number
  metadata?: {
    createdAt: number
    lastAccessedAt: number
    expiresAt?: number
    accessCount: number
    encrypted: boolean
  }
}

/**
 * 引擎健康状态
 */
export interface EngineHealth {
  name: StorageEngine
  available: boolean
  usageRatio: number  // 0-1
  itemCount: number
  size: number
  maxSize: number
  status: 'healthy' | 'warning' | 'critical'
}

/**
 * 缓存检查器
 */
export class CacheInspector {
  private refreshTimer?: number
  private stats: CacheStats | null = null

  constructor(
    private cache: CacheManager,
    private options: InspectorOptions = {},
  ) {
    if (options.autoRefresh) {
      this.startAutoRefresh()
    }
  }

  /**
   * 启动自动刷新
   */
  private startAutoRefresh(): void {
    const interval = this.options.refreshInterval || 1000

    this.refreshTimer = window.setInterval(async () => {
      await this.refresh()
    }, interval)
  }

  /**
   * 停止自动刷新
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = undefined
    }
  }

  /**
   * 刷新统计信息
   */
  async refresh(): Promise<void> {
    this.stats = await this.cache.getStats()

    if (this.options.logToConsole) {
      this.logToConsole()
    }
  }

  /**
   * 获取所有缓存项
   */
  async getAllItems(): Promise<CacheItemDetail[]> {
    const items: CacheItemDetail[] = []
    const keys = await this.cache.keys()

    for (const key of keys) {
      const value = await this.cache.get(key)
      const metadata = await this.cache.getMetadata(key)

      if (value !== null && metadata) {
        items.push({
          key,
          value,
          engine: metadata.engine,
          size: metadata.size,
          metadata: {
            createdAt: metadata.createdAt,
            lastAccessedAt: metadata.lastAccessedAt,
            expiresAt: metadata.expiresAt,
            accessCount: metadata.accessCount,
            encrypted: metadata.encrypted,
          },
        })
      }
    }

    return items
  }

  /**
   * 搜索缓存项
   */
  async searchItems(pattern: string | RegExp): Promise<CacheItemDetail[]> {
    const allItems = await this.getAllItems()
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    return allItems.filter(item => regex.test(item.key))
  }

  /**
   * 获取引擎健康状态
   */
  async getEngineHealth(): Promise<EngineHealth[]> {
    if (!this.stats) {
      await this.refresh()
    }

    if (!this.stats) {
      return []
    }

    const health: EngineHealth[] = []

    for (const [engineName, engineStats] of Object.entries(this.stats.engines)) {
      const usageRatio = engineStats.size / (engineStats.size + 1000000) // 假设最大值

      let status: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (usageRatio > 0.9) {
        status = 'critical'
      }
      else if (usageRatio > 0.7) {
        status = 'warning'
      }

      health.push({
        name: engineName as StorageEngine,
        available: engineStats.available,
        usageRatio,
        itemCount: engineStats.itemCount,
        size: engineStats.size,
        maxSize: engineStats.size + 1000000, // 需要从引擎获取
        status,
      })
    }

    return health
  }

  /**
   * 获取热点键（访问次数最多）
   */
  async getHotKeys(limit = 10): Promise<Array<{ key: string, accessCount: number }>> {
    const items = await this.getAllItems()

    return items
      .filter(item => item.metadata?.accessCount)
      .sort((a, b) => (b.metadata?.accessCount || 0) - (a.metadata?.accessCount || 0))
      .slice(0, limit)
      .map(item => ({
        key: item.key,
        accessCount: item.metadata?.accessCount || 0,
      }))
  }

  /**
   * 获取大数据项（占用空间最多）
   */
  async getLargestItems(limit = 10): Promise<Array<{ key: string, size: number }>> {
    const items = await this.getAllItems()

    return items
      .sort((a, b) => b.size - a.size)
      .slice(0, limit)
      .map(item => ({
        key: item.key,
        size: item.size,
      }))
  }

  /**
   * 获取即将过期的项
   */
  async getExpiringItems(withinMs = 60000): Promise<CacheItemDetail[]> {
    const items = await this.getAllItems()
    const now = Date.now()
    const threshold = now + withinMs

    return items
      .filter(item =>
        item.metadata?.expiresAt &&
        item.metadata.expiresAt <= threshold &&
        item.metadata.expiresAt > now
      )
      .sort((a, b) => (a.metadata?.expiresAt || 0) - (b.metadata?.expiresAt || 0))
  }

  /**
   * 生成健康检查报告
   */
  async generateHealthReport(): Promise<string> {
    await this.refresh()

    if (!this.stats) {
      return 'No stats available'
    }

    const engineHealth = await this.getEngineHealth()
    const hotKeys = await this.getHotKeys(5)
    const largestItems = await this.getLargestItems(5)
    const expiringItems = await this.getExpiringItems(60000)

    let report = '=== Cache Health Report ===\n\n'

    // 总体统计
    report += `Overall Statistics:\n`
    report += `  Total Items: ${this.stats.totalItems}\n`
    report += `  Total Size: ${this.formatBytes(this.stats.totalSize)}\n`
    report += `  Hit Rate: ${(this.stats.hitRate * 100).toFixed(2)}%\n`
    report += `  Expired Items: ${this.stats.expiredItems}\n\n`

    // 引擎健康
    report += `Engine Health:\n`
    for (const health of engineHealth) {
      const emoji = health.status === 'healthy' ? '✅' : health.status === 'warning' ? '⚠️' : '❌'
      report += `  ${emoji} ${health.name}: ${(health.usageRatio * 100).toFixed(1)}% used, ${health.itemCount} items\n`
    }
    report += '\n'

    // 热点键
    if (hotKeys.length > 0) {
      report += `Hot Keys (Top 5):\n`
      for (const item of hotKeys) {
        report += `  ${item.key}: ${item.accessCount} accesses\n`
      }
      report += '\n'
    }

    // 大数据项
    if (largestItems.length > 0) {
      report += `Largest Items (Top 5):\n`
      for (const item of largestItems) {
        report += `  ${item.key}: ${this.formatBytes(item.size)}\n`
      }
      report += '\n'
    }

    // 即将过期
    if (expiringItems.length > 0) {
      report += `Expiring Soon (within 1 minute):\n`
      for (const item of expiringItems) {
        const ttl = (item.metadata?.expiresAt || 0) - Date.now()
        report += `  ${item.key}: expires in ${Math.floor(ttl / 1000)}s\n`
      }
      report += '\n'
    }

    // 建议
    report += `Recommendations:\n`
    const recommendations = this.generateRecommendations()
    for (const rec of recommendations) {
      report += `  • ${rec}\n`
    }

    return report
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(): string[] {
    if (!this.stats) {
      return []
    }

    const recommendations: string[] = []

    // 命中率建议
    if (this.stats.hitRate < 0.5) {
      recommendations.push('命中率较低（<50%），考虑调整 TTL 或增加缓存项')
    }

    // 过期项建议
    if (this.stats.expiredItems > this.stats.totalItems * 0.2) {
      recommendations.push('过期项较多（>20%），建议运行 cleanup()')
    }

    // 存储压力建议
    for (const [engineName, engineStats] of Object.entries(this.stats.engines)) {
      const ratio = engineStats.size / (engineStats.size + 1000000)
      if (ratio > 0.9) {
        recommendations.push(`${engineName} 存储压力大（>90%），考虑清理或增加配额`)
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('缓存运行良好，无需调整')
    }

    return recommendations
  }

  /**
   * 格式化字节
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
  }

  /**
   * 输出到控制台
   */
  private logToConsole(): void {
    if (!this.stats) {
      return
    }

    console.group('📊 Cache Inspector')
    console.log('Total Items:', this.stats.totalItems)
    console.log('Total Size:', this.formatBytes(this.stats.totalSize))
    console.log('Hit Rate:', `${(this.stats.hitRate * 100).toFixed(2)}%`)

    console.group('Engines')
    for (const [name, stats] of Object.entries(this.stats.engines)) {
      console.log(`${name}:`, {
        items: stats.itemCount,
        size: this.formatBytes(stats.size),
        hits: stats.hits,
        misses: stats.misses,
      })
    }
    console.groupEnd()

    console.groupEnd()
  }

  /**
   * 创建可视化数据（用于图表）
   */
  getVisualizationData(): {
    engineDistribution: Array<{ name: string, value: number }>
    sizeDistribution: Array<{ name: string, value: number }>
    hitRateHistory: number[]
  } {
    if (!this.stats) {
      return {
        engineDistribution: [],
        sizeDistribution: [],
        hitRateHistory: [],
      }
    }

    const engineDistribution = Object.entries(this.stats.engines).map(([name, stats]) => ({
      name,
      value: stats.itemCount,
    }))

    const sizeDistribution = Object.entries(this.stats.engines).map(([name, stats]) => ({
      name,
      value: stats.size,
    }))

    return {
      engineDistribution,
      sizeDistribution,
      hitRateHistory: [this.stats.hitRate], // 可以扩展为历史记录
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoRefresh()
  }
}

/**
 * 创建缓存检查器
 */
export function createCacheInspector(
  cache: CacheManager,
  options?: InspectorOptions,
): CacheInspector {
  return new CacheInspector(cache, options)
}

/**
 * 安装到 window（开发环境）
 */
export function installDevTools(cache: CacheManager): void {
  if (typeof window === 'undefined') {
    return
  }

  const inspector = new CacheInspector(cache, {
    autoRefresh: true,
    refreshInterval: 5000,
  })

  // 动态导入高级检查器
  let advancedInspector: any = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AdvancedCacheInspector } = require('./advanced-inspector')
    advancedInspector = new AdvancedCacheInspector(cache)
  }
  catch {
    // 高级检查器不可用，仅使用基础功能
  }

  // 挂载到 window
  ; (window as any).__CACHE_DEVTOOLS__ = {
    inspector,
    advancedInspector,

    // 基础快捷方法
    async stats() {
      return cache.getStats()
    },

    async items() {
      return inspector.getAllItems()
    },

    async search(pattern: string) {
      return inspector.searchItems(pattern)
    },

    async health() {
      return inspector.getEngineHealth()
    },

    async report() {
      const report = await inspector.generateHealthReport()
      console.log(report)
      return report
    },

    async hotKeys(limit = 10) {
      return inspector.getHotKeys(limit)
    },

    async largest(limit = 10) {
      return inspector.getLargestItems(limit)
    },

    async expiring(withinMs = 60000) {
      return inspector.getExpiringItems(withinMs)
    },

    async visualize() {
      return inspector.getVisualizationData()
    },

    // 高级功能（如果可用）
    async dashboard() {
      if (!advancedInspector) {
        console.warn('Advanced inspector not available')
        return null
      }
      const data = await advancedInspector.generateDashboard()
      console.group('📊 缓存仪表板')
      console.table(data.realtime)
      console.table(data.engines)
      console.groupEnd()
      return data
    },

    async analyze() {
      if (!advancedInspector) {
        console.warn('Advanced inspector not available')
        return []
      }
      const suggestions = await advancedInspector.getOptimizationSuggestions()
      console.group('💡 优化建议')
      suggestions.forEach((s: any) => {
        const icon = s.severity === 'critical' ? '🔴' : s.severity === 'warning' ? '⚠️' : 'ℹ️'
        console.log(`${icon} ${s.message}`)
        if (s.data?.recommendation) {
          console.log(`   建议: ${s.data.recommendation}`)
        }
      })
      console.groupEnd()
      return suggestions
    },

    async memory() {
      if (!advancedInspector) {
        console.warn('Advanced inspector not available')
        return null
      }
      const breakdown = await advancedInspector.getMemoryBreakdown()
      console.table(breakdown.engines)
      console.log(advancedInspector.generateMemoryChart(breakdown))
      return breakdown
    },

    async healthReport() {
      if (!advancedInspector) {
        console.warn('Advanced inspector not available')
        return null
      }
      const report = await advancedInspector.generateHealthReport()
      console.log(report)
      return report
    },

    async performance() {
      const metrics = cache.getPerformanceMetrics()
      console.group('⚡ 性能指标')
      console.table({
        GET: metrics.operations.get,
        SET: metrics.operations.set,
        REMOVE: metrics.operations.remove,
      })
      console.groupEnd()
      return metrics
    },
  }

  console.log('✅ Cache DevTools 已安装')
  console.log('使用 window.__CACHE_DEVTOOLS__ 访问调试工具')
  console.log('')
  console.log('基础功能:')
  console.log('  __CACHE_DEVTOOLS__.stats() - 获取统计信息')
  console.log('  __CACHE_DEVTOOLS__.items() - 列出所有缓存项')
  console.log('  __CACHE_DEVTOOLS__.report() - 生成健康报告')
  console.log('  __CACHE_DEVTOOLS__.health() - 检查引擎健康')
  console.log('')
  console.log('高级功能:')
  console.log('  __CACHE_DEVTOOLS__.dashboard() - 实时监控仪表板')
  console.log('  __CACHE_DEVTOOLS__.analyze() - 自动优化建议')
  console.log('  __CACHE_DEVTOOLS__.memory() - 内存使用分析')
  console.log('  __CACHE_DEVTOOLS__.performance() - 性能指标')
  console.log('  __CACHE_DEVTOOLS__.healthReport() - 完整健康报告')
}

