/**
 * 自适应存储策略
 * 
 * 根据使用模式自动调整引擎选择，优化性能和资源利用
 * 
 * 自适应特性：
 * - 学习访问模式（频率、大小、TTL）
 * - 跟踪引擎性能表现
 * - 自动切换到更优引擎
 * - 基于置信度的决策
 * 
 * @example
 * ```typescript
 * const strategy = new AdaptiveStorageStrategy({
 *   learningPeriod: 100, // 学习期：前100次访问
 *   switchThreshold: 0.9, // 切换阈值：90%置信度
 * })
 * 
 * // 持续使用，策略会自动学习和优化
 * const engine = await strategy.selectEngine('user:123', userData, options)
 * ```
 */

import type { SerializableValue, SetOptions, StorageEngine } from '../types'
import { calculateByteSize } from '../utils'

/**
 * 使用模式
 */
export interface UsagePattern {
  /** 缓存键 */
  key: string

  /** 访问次数 */
  accessCount: number

  /** 总数据大小 */
  totalSize: number

  /** 平均数据大小 */
  avgSize: number

  /** TTL历史 */
  ttlHistory: number[]

  /** 平均TTL */
  avgTTL?: number

  /** 当前使用的引擎 */
  currentEngine?: StorageEngine

  /** 性能得分（0-1） */
  performanceScore: number

  /** 最后访问时间 */
  lastAccess: number

  /** 创建时间 */
  createdAt: number
}

/**
 * 引擎推荐结果
 */
export interface EngineRecommendation {
  /** 推荐的引擎 */
  engine: StorageEngine

  /** 推荐理由 */
  reason: string

  /** 置信度（0-1） */
  confidence: number

  /** 预期性能提升（0-1） */
  expectedImprovement?: number
}

/**
 * 自适应策略配置
 */
export interface AdaptiveStrategyConfig {
  /** 学习期（访问次数） */
  learningPeriod?: number

  /** 引擎切换的置信度阈值 */
  switchThreshold?: number

  /** 性能评估窗口（访问次数） */
  performanceWindow?: number

  /** 模式保留数量 */
  maxPatterns?: number
}

/**
 * 自适应存储策略
 */
export class AdaptiveStorageStrategy {
  /** 使用模式映射 */
  private patterns = new Map<string, UsagePattern>()

  /** 引擎性能历史 */
  private enginePerformance = new Map<StorageEngine, {
    successRate: number
    avgLatency: number
    totalOperations: number
  }>()

  /** 配置 */
  private config: Required<AdaptiveStrategyConfig>

  /**
   * 创建自适应策略
   * 
   * @param config - 配置选项
   */
  constructor(config?: AdaptiveStrategyConfig) {
    this.config = {
      learningPeriod: config?.learningPeriod ?? 100,
      switchThreshold: config?.switchThreshold ?? 0.9,
      performanceWindow: config?.performanceWindow ?? 50,
      maxPatterns: config?.maxPatterns ?? 1000,
    }
  }

  /**
   * 选择最优引擎
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 选项
   * @returns 引擎推荐结果
   */
  async selectEngine(
    key: string,
    value: SerializableValue,
    options?: SetOptions,
  ): Promise<EngineRecommendation> {
    // 获取或创建使用模式
    const pattern = this.getOrCreatePattern(key)

    // 更新模式数据
    this.updatePattern(pattern, value, options)

    // 如果还在学习期，使用基础策略
    if (pattern.accessCount < this.config.learningPeriod) {
      return this.selectBasicEngine(value, options)
    }

    // 根据模式选择最优引擎
    const recommendation = this.recommendEngine(pattern, value, options)

    // 检查是否应该切换引擎
    if (this.shouldSwitchEngine(pattern, recommendation)) {
      pattern.currentEngine = recommendation.engine
    }

    return recommendation
  }

  /**
   * 获取或创建使用模式
   * 
   * @param key - 缓存键
   * @returns 使用模式
   */
  private getOrCreatePattern(key: string): UsagePattern {
    let pattern = this.patterns.get(key)

    if (!pattern) {
      pattern = {
        key,
        accessCount: 0,
        totalSize: 0,
        avgSize: 0,
        ttlHistory: [],
        performanceScore: 0.5,
        lastAccess: Date.now(),
        createdAt: Date.now(),
      }

      this.patterns.set(key, pattern)

      // 限制模式数量
      if (this.patterns.size > this.config.maxPatterns) {
        this.prunePatterns()
      }
    }

    return pattern
  }

  /**
   * 更新使用模式
   * 
   * @param pattern - 使用模式
   * @param value - 缓存值
   * @param options - 选项
   */
  private updatePattern(
    pattern: UsagePattern,
    value: SerializableValue,
    options?: SetOptions,
  ): void {
    pattern.accessCount++
    pattern.lastAccess = Date.now()

    // 更新大小统计
    const size = calculateByteSize(JSON.stringify(value))
    pattern.totalSize += size
    pattern.avgSize = pattern.totalSize / pattern.accessCount

    // 更新TTL统计
    if (options?.ttl) {
      pattern.ttlHistory.push(options.ttl)

      // 保持最近50个TTL记录
      if (pattern.ttlHistory.length > 50) {
        pattern.ttlHistory.shift()
      }

      // 计算平均TTL
      pattern.avgTTL = pattern.ttlHistory.reduce((a, b) => a + b, 0)
        / pattern.ttlHistory.length
    }
  }

  /**
   * 推荐引擎
   * 
   * 基于使用模式推荐最优引擎
   * 
   * @param pattern - 使用模式
   * @param value - 缓存值
   * @param options - 选项
   * @returns 引擎推荐
   */
  private recommendEngine(
    pattern: UsagePattern,
    value: SerializableValue,
    options?: SetOptions,
  ): EngineRecommendation {
    const scores = this.scoreEngines(pattern, value, options)

    // 选择得分最高的引擎
    let bestEngine: StorageEngine = 'memory'
    let bestScore = 0

    for (const [engine, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score
        bestEngine = engine as StorageEngine
      }
    }

    return {
      engine: bestEngine,
      reason: this.getRecommendationReason(pattern, bestEngine),
      confidence: bestScore,
    }
  }

  /**
   * 为每个引擎打分
   * 
   * @param pattern - 使用模式
   * @param value - 缓存值
   * @param options - 选项
   * @returns 引擎得分映射
   */
  private scoreEngines(
    pattern: UsagePattern,
    value: SerializableValue,
    options?: SetOptions,
  ): Record<StorageEngine, number> {
    const scores: Partial<Record<StorageEngine, number>> = {}

    // 基于数据大小评分
    const size = pattern.avgSize
    const ttl = pattern.avgTTL || options?.ttl || 0

    // Memory: 适合小数据 + 短TTL + 高频访问
    scores.memory = this.scoreMemory(size, ttl, pattern.accessCount)

    // localStorage: 适合中等数据 + 长TTL
    scores.localStorage = this.scoreLocalStorage(size, ttl)

    // sessionStorage: 适合临时数据
    scores.sessionStorage = this.scoreSessionStorage(size, ttl)

    // IndexedDB: 适合大数据
    scores.indexedDB = this.scoreIndexedDB(size, ttl)

    // OPFS: 适合超大数据
    scores.opfs = this.scoreOPFS(size, ttl)

    return scores as Record<StorageEngine, number>
  }

  /**
   * 内存引擎评分
   */
  private scoreMemory(size: number, ttl: number, accessCount: number): number {
    let score = 0.5

    // 小数据加分
    if (size < 1024) {
      score += 0.2
    }

    // 短TTL加分
    if (ttl < 5 * 60 * 1000) {
      score += 0.2
    }

    // 高频访问加分
    if (accessCount > 100) {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  /**
   * localStorage引擎评分
   */
  private scoreLocalStorage(size: number, ttl: number): number {
    let score = 0.6

    // 中等数据最佳
    if (size >= 1024 && size < 100 * 1024) {
      score += 0.2
    }

    // 长TTL加分
    if (ttl > 24 * 60 * 60 * 1000) {
      score += 0.2
    }

    return Math.min(score, 1)
  }

  /**
   * sessionStorage引擎评分
   */
  private scoreSessionStorage(size: number, ttl: number): number {
    let score = 0.5

    // 中短期TTL最佳
    if (ttl > 5 * 60 * 1000 && ttl < 60 * 60 * 1000) {
      score += 0.3
    }

    return Math.min(score, 1)
  }

  /**
   * IndexedDB引擎评分
   */
  private scoreIndexedDB(size: number, ttl: number): number {
    let score = 0.4

    // 大数据加分
    if (size > 100 * 1024) {
      score += 0.4
    }

    // 长期存储加分
    if (ttl > 7 * 24 * 60 * 60 * 1000) {
      score += 0.2
    }

    return Math.min(score, 1)
  }

  /**
   * OPFS引擎评分
   */
  private scoreOPFS(size: number, ttl: number): number {
    let score = 0.3

    // 超大数据最佳
    if (size > 1024 * 1024) {
      score += 0.5
    }

    return Math.min(score, 1)
  }

  /**
   * 判断是否应该切换引擎
   * 
   * @param pattern - 使用模式
   * @param recommendation - 推荐结果
   * @returns 是否切换
   */
  private shouldSwitchEngine(
    pattern: UsagePattern,
    recommendation: EngineRecommendation,
  ): boolean {
    // 第一次选择
    if (!pattern.currentEngine) {
      return true
    }

    // 推荐引擎与当前相同
    if (pattern.currentEngine === recommendation.engine) {
      return false
    }

    // 置信度高于阈值，建议切换
    if (recommendation.confidence > this.config.switchThreshold) {
      return true
    }

    // 当前引擎性能差
    if (pattern.performanceScore < 0.5) {
      return true
    }

    return false
  }

  /**
   * 获取推荐理由
   * 
   * @param pattern - 使用模式
   * @param engine - 推荐引擎
   * @returns 推荐理由
   */
  private getRecommendationReason(
    pattern: UsagePattern,
    engine: StorageEngine,
  ): string {
    const reasons: string[] = []

    switch (engine) {
      case 'memory':
        if (pattern.avgSize < 1024) {
          reasons.push('小数据')
        }
        if (pattern.avgTTL && pattern.avgTTL < 5 * 60 * 1000) {
          reasons.push('短TTL')
        }
        if (pattern.accessCount > 100) {
          reasons.push('高频访问')
        }
        break

      case 'localStorage':
        if (pattern.avgSize >= 1024 && pattern.avgSize < 100 * 1024) {
          reasons.push('中等数据')
        }
        if (pattern.avgTTL && pattern.avgTTL > 24 * 60 * 60 * 1000) {
          reasons.push('长期存储')
        }
        break

      case 'indexedDB':
        if (pattern.avgSize > 100 * 1024) {
          reasons.push('大数据')
        }
        break

      case 'opfs':
        if (pattern.avgSize > 1024 * 1024) {
          reasons.push('超大数据')
        }
        break
    }

    return reasons.length > 0 ? reasons.join(', ') : `自适应选择: ${engine}`
  }

  /**
   * 基础引擎选择（学习期使用）
   * 
   * @param value - 缓存值
   * @param options - 选项
   * @returns 引擎推荐
   */
  private selectBasicEngine(
    value: SerializableValue,
    options?: SetOptions,
  ): EngineRecommendation {
    const size = calculateByteSize(JSON.stringify(value))
    const ttl = options?.ttl || 0

    // 简单规则
    if (size > 1024 * 1024) {
      return {
        engine: 'opfs',
        reason: '超大数据',
        confidence: 0.8,
      }
    }

    if (size > 100 * 1024) {
      return {
        engine: 'indexedDB',
        reason: '大数据',
        confidence: 0.8,
      }
    }

    if (ttl < 5 * 60 * 1000) {
      return {
        engine: 'memory',
        reason: '短期缓存',
        confidence: 0.8,
      }
    }

    return {
      engine: 'localStorage',
      reason: '通用存储',
      confidence: 0.7,
    }
  }

  /**
   * 修剪模式（删除最少使用的）
   */
  private prunePatterns(): void {
    // 按访问次数和最后访问时间排序
    const sorted = Array.from(this.patterns.entries())
      .sort((a, b) => {
        // 优先删除访问次数少且长时间未访问的
        const scoreA = a[1].accessCount / (Date.now() - a[1].lastAccess + 1)
        const scoreB = b[1].accessCount / (Date.now() - b[1].lastAccess + 1)
        return scoreA - scoreB
      })

    // 保留前80%
    const toKeep = sorted.slice(Math.floor(sorted.length * 0.2))

    this.patterns.clear()
    for (const [key, pattern] of toKeep) {
      this.patterns.set(key, pattern)
    }
  }

  /**
   * 更新引擎性能
   * 
   * @param engine - 引擎类型
   * @param success - 是否成功
   * @param latency - 延迟（毫秒）
   */
  updateEnginePerformance(
    engine: StorageEngine,
    success: boolean,
    latency: number,
  ): void {
    const perf = this.enginePerformance.get(engine) || {
      successRate: 1,
      avgLatency: 0,
      totalOperations: 0,
    }

    perf.totalOperations++
    perf.successRate = (perf.successRate * (perf.totalOperations - 1) + (success ? 1 : 0))
      / perf.totalOperations
    perf.avgLatency = (perf.avgLatency * (perf.totalOperations - 1) + latency)
      / perf.totalOperations

    this.enginePerformance.set(engine, perf)
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalPatterns: number
    enginePerformance: Map<StorageEngine, { successRate: number, avgLatency: number }>
    topPatterns: Array<{ key: string, accessCount: number, engine?: StorageEngine }>
  } {
    const topPatterns = Array.from(this.patterns.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(p => ({
        key: p.key,
        accessCount: p.accessCount,
        engine: p.currentEngine,
      }))

    return {
      totalPatterns: this.patterns.size,
      enginePerformance: this.enginePerformance,
      topPatterns,
    }
  }

  /**
   * 重置策略
   */
  reset(): void {
    this.patterns.clear()
    this.enginePerformance.clear()
  }
}

/**
 * 创建自适应策略
 * 
 * @param config - 配置选项
 * @returns 自适应策略实例
 */
export function createAdaptiveStrategy(config?: AdaptiveStrategyConfig): AdaptiveStorageStrategy {
  return new AdaptiveStorageStrategy(config)
}

