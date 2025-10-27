/**
 * 智能预测缓存
 * 
 * 基于访问模式进行智能预测和预取：
 * - 访问序列关联分析（A访问后常访问B）
 * - 时间模式预测（周期性访问检测）
 * - 置信度评估
 * - 上下文感知预测
 * 
 * 预测算法：
 * 1. 关联规则挖掘：记录键之间的访问关联
 * 2. 时间序列分析：分析访问时间间隔的规律性
 * 3. 概率计算：基于历史数据计算预取置信度
 * 
 * @example
 * ```typescript
 * const predictor = new PredictiveCache()
 * 
 * // 记录访问
 * predictor.recordAccess('user:list')
 * predictor.recordAccess('user:1')
 * predictor.recordAccess('user:2')
 * 
 * // 预测下一步
 * const next = predictor.predictNext('user:list', 3)
 * // ['user:1', 'user:2', 'user:3']
 * 
 * // 时间模式预测
 * const prediction = predictor.predictByTimePattern('user:list')
 * if (prediction.shouldPrefetch && prediction.confidence > 0.7) {
 *   // 执行预取
 * }
 * ```
 */

/**
 * 访问模式记录
 */
export interface AccessPattern {
  /** 缓存键 */
  key: string
  /** 访问时间戳 */
  timestamp: number
  /** 访问上下文（可选，如用户ID、页面路径等） */
  context?: Record<string, unknown>
}

/**
 * 时间模式预测结果
 */
export interface TimePatternPrediction {
  /** 是否建议预取 */
  shouldPrefetch: boolean
  /** 预测置信度（0-1） */
  confidence: number
  /** 预计下次访问时间 */
  expectedNextAccess?: number
  /** 访问规律性（0-1，越高越规律） */
  regularity?: number
}

/**
 * 关联规则
 */
export interface AssociationRule {
  /** 前提键 */
  antecedent: string
  /** 结果键 */
  consequent: string
  /** 支持度（出现频率） */
  support: number
  /** 置信度（条件概率） */
  confidence: number
  /** 提升度（相关性强度） */
  lift: number
}

/**
 * 预测配置
 */
export interface PredictiveCacheConfig {
  /** 访问历史保留数量 */
  historySize?: number

  /** 每键模式保留数量 */
  patternSize?: number

  /** 关联窗口时间（毫秒） */
  associationWindow?: number

  /** 最小支持度阈值 */
  minSupport?: number

  /** 最小置信度阈值 */
  minConfidence?: number
}

/**
 * 智能预测缓存
 */
export class PredictiveCache {
  /** 全局访问历史（滚动窗口） */
  private accessHistory: AccessPattern[] = []

  /** 每个键的访问模式 */
  private patterns = new Map<string, AccessPattern[]>()

  /** 键关联关系：key -> (associatedKey -> count) */
  private associations = new Map<string, Map<string, number>>()

  /** 配置 */
  private config: Required<PredictiveCacheConfig>

  /** 总访问次数（用于计算支持度） */
  private totalAccesses: number = 0

  /**
   * 创建预测缓存
   * 
   * @param config - 配置选项
   */
  constructor(config?: PredictiveCacheConfig) {
    this.config = {
      historySize: config?.historySize ?? 10000,
      patternSize: config?.patternSize ?? 50,
      associationWindow: config?.associationWindow ?? 5000,
      minSupport: config?.minSupport ?? 0.01,
      minConfidence: config?.minConfidence ?? 0.3,
    }
  }

  /**
   * 记录访问
   * 
   * @param key - 缓存键
   * @param context - 访问上下文（可选）
   */
  recordAccess(key: string, context?: Record<string, unknown>): void {
    const pattern: AccessPattern = {
      key,
      timestamp: Date.now(),
      context,
    }

    // 添加到全局历史
    this.accessHistory.push(pattern)
    this.totalAccesses++

    // 保持滚动窗口
    if (this.accessHistory.length > this.config.historySize) {
      this.accessHistory.shift()
    }

    // 更新键的访问模式
    this.updatePatterns(pattern)

    // 更新关联关系
    this.updateAssociations(pattern)
  }

  /**
   * 预测下一个可能访问的键
   * 
   * 基于关联规则，返回最可能访问的键列表
   * 
   * @param currentKey - 当前访问的键
   * @param topN - 返回前N个预测
   * @returns 预测的键数组（按置信度降序）
   */
  predictNext(currentKey: string, topN: number = 3): string[] {
    const associations = this.associations.get(currentKey)
    if (!associations || associations.size === 0) {
      return []
    }

    // 按关联次数排序
    return Array.from(associations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([key]) => key)
  }

  /**
   * 基于时间模式预测
   * 
   * 分析访问时间间隔的规律性，预测下次访问时机
   * 
   * 算法：
   * 1. 计算访问时间间隔序列
   * 2. 计算平均间隔和标准差
   * 3. 评估规律性（标准差越小越规律）
   * 4. 基于当前时间和平均间隔判断是否应预取
   * 
   * @param key - 缓存键
   * @returns 时间模式预测结果
   */
  predictByTimePattern(key: string): TimePatternPrediction {
    const patterns = this.patterns.get(key)

    // 至少需要10次访问才能建立可靠的模式
    if (!patterns || patterns.length < 10) {
      return { shouldPrefetch: false, confidence: 0 }
    }

    // 计算访问时间间隔
    const intervals: number[] = []
    for (let i = 1; i < patterns.length; i++) {
      intervals.push(patterns[i].timestamp - patterns[i - 1].timestamp)
    }

    // 计算统计量
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2)
    }, 0) / intervals.length
    const stdDev = Math.sqrt(variance)

    // 计算规律性（变异系数的倒数）
    // 变异系数 = 标准差 / 平均值，越小越规律
    const regularity = avgInterval > 0 ? 1 - Math.min(stdDev / avgInterval, 1) : 0

    // 计算距离上次访问的时间
    const timeSinceLastAccess = Date.now() - patterns[patterns.length - 1].timestamp

    // 预期下次访问时间
    const expectedNextAccess = patterns[patterns.length - 1].timestamp + avgInterval

    // 如果接近平均间隔（80%以上），建议预取
    const shouldPrefetch = timeSinceLastAccess >= avgInterval * 0.8

    // 置信度 = 规律性 × 时间因子
    const timeFactor = Math.min(timeSinceLastAccess / avgInterval, 1)
    const confidence = regularity * timeFactor

    return {
      shouldPrefetch,
      confidence: Math.min(confidence, 1),
      expectedNextAccess,
      regularity,
    }
  }

  /**
   * 获取关联规则
   * 
   * @param key - 缓存键
   * @param minConfidence - 最小置信度阈值
   * @returns 关联规则数组
   */
  getAssociationRules(
    key: string,
    minConfidence: number = 0.5,
  ): AssociationRule[] {
    const associations = this.associations.get(key)
    if (!associations) {
      return []
    }

    const rules: AssociationRule[] = []
    const keyAccessCount = this.getKeyAccessCount(key)

    for (const [consequent, coOccurrence] of associations) {
      // 计算支持度：共现次数 / 总访问次数
      const support = this.totalAccesses > 0 ? coOccurrence / this.totalAccesses : 0

      // 计算置信度：P(B|A) = P(A∩B) / P(A)
      const confidence = keyAccessCount > 0 ? coOccurrence / keyAccessCount : 0

      // 计算提升度：confidence / P(B)
      const consequentCount = this.getKeyAccessCount(consequent)
      const consequentProbability = this.totalAccesses > 0 ? consequentCount / this.totalAccesses : 0
      const lift = consequentProbability > 0 ? confidence / consequentProbability : 0

      // 过滤低置信度规则
      if (confidence >= minConfidence) {
        rules.push({
          antecedent: key,
          consequent,
          support,
          confidence,
          lift,
        })
      }
    }

    // 按置信度降序排序
    return rules.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * 获取键的访问次数
   * 
   * @param key - 缓存键
   * @returns 访问次数
   */
  private getKeyAccessCount(key: string): number {
    const patterns = this.patterns.get(key)
    return patterns ? patterns.length : 0
  }

  /**
   * 更新访问模式
   * 
   * @param pattern - 访问模式
   */
  private updatePatterns(pattern: AccessPattern): void {
    const patterns = this.patterns.get(pattern.key) || []
    patterns.push(pattern)

    // 保持最近N次访问
    if (patterns.length > this.config.patternSize) {
      patterns.shift()
    }

    this.patterns.set(pattern.key, patterns)
  }

  /**
   * 更新键关联关系
   * 
   * 关联规则挖掘：如果在时间窗口内访问了多个键，建立关联
   * 
   * @param pattern - 新的访问模式
   */
  private updateAssociations(pattern: AccessPattern): void {
    // 查找时间窗口内的其他访问
    const windowStart = pattern.timestamp - this.config.associationWindow
    const recentAccesses = this.accessHistory.filter(p =>
      p.timestamp > windowStart
      && p.timestamp < pattern.timestamp
      && p.key !== pattern.key,
    )

    // 为每个最近访问的键建立与当前键的关联
    for (const recent of recentAccesses) {
      const associations = this.associations.get(recent.key) || new Map()
      const currentCount = associations.get(pattern.key) || 0
      associations.set(pattern.key, currentCount + 1)
      this.associations.set(recent.key, associations)
    }

    // 反向关联：当前键 -> 最近访问的键
    const currentAssociations = this.associations.get(pattern.key) || new Map()
    for (const recent of recentAccesses) {
      const currentCount = currentAssociations.get(recent.key) || 0
      currentAssociations.set(recent.key, currentCount + 1)
    }
    if (recentAccesses.length > 0) {
      this.associations.set(pattern.key, currentAssociations)
    }

    // 限制关联数量，避免内存无限增长
    this.pruneAssociations()
  }

  /**
   * 修剪关联关系
   * 
   * 删除低频关联，保持内存在合理范围
   */
  private pruneAssociations(): void {
    // 如果关联总数超过限制，删除低频关联
    const totalAssociations = Array.from(this.associations.values())
      .reduce((sum, map) => sum + map.size, 0)

    if (totalAssociations > 10000) {
      // 对每个键的关联按频率排序，只保留前50个
      for (const [key, associations] of this.associations) {
        const sorted = Array.from(associations.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 50)

        this.associations.set(key, new Map(sorted))
      }
    }
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalAccesses: number
    uniqueKeys: number
    totalAssociations: number
    avgAssociationsPerKey: number
    topPatterns: Array<{ key: string, accessCount: number }>
  } {
    const uniqueKeys = this.patterns.size
    const totalAssociations = Array.from(this.associations.values())
      .reduce((sum, map) => sum + map.size, 0)

    // 获取访问最频繁的键
    const topPatterns = Array.from(this.patterns.entries())
      .map(([key, patterns]) => ({
        key,
        accessCount: patterns.length,
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)

    return {
      totalAccesses: this.totalAccesses,
      uniqueKeys,
      totalAssociations,
      avgAssociationsPerKey: uniqueKeys > 0 ? totalAssociations / uniqueKeys : 0,
      topPatterns,
    }
  }

  /**
   * 重置所有数据
   */
  reset(): void {
    this.accessHistory = []
    this.patterns.clear()
    this.associations.clear()
    this.totalAccesses = 0
  }

  /**
   * 导出预测模型数据
   * 
   * 用于持久化或分析
   * 
   * @returns 模型数据
   */
  exportModel(): {
    patterns: Array<{ key: string, accesses: AccessPattern[] }>
    associations: Array<{
      key: string
      related: Array<{ key: string, count: number }>
    }>
    stats: ReturnType<typeof this.getStats>
  } {
    return {
      patterns: Array.from(this.patterns.entries()).map(([key, accesses]) => ({
        key,
        accesses,
      })),
      associations: Array.from(this.associations.entries()).map(([key, related]) => ({
        key,
        related: Array.from(related.entries()).map(([k, count]) => ({ key: k, count })),
      })),
      stats: this.getStats(),
    }
  }

  /**
   * 导入预测模型数据
   * 
   * @param modelData - 模型数据
   */
  importModel(modelData: ReturnType<typeof this.exportModel>): void {
    this.reset()

    // 导入模式
    for (const { key, accesses } of modelData.patterns) {
      this.patterns.set(key, accesses)
    }

    // 导入关联
    for (const { key, related } of modelData.associations) {
      const map = new Map(related.map(r => [r.key, r.count]))
      this.associations.set(key, map)
    }

    // 重建访问历史（从模式中）
    for (const patterns of this.patterns.values()) {
      this.accessHistory.push(...patterns)
    }

    // 按时间排序
    this.accessHistory.sort((a, b) => a.timestamp - b.timestamp)

    // 限制大小
    if (this.accessHistory.length > this.config.historySize) {
      this.accessHistory = this.accessHistory.slice(-this.config.historySize)
    }

    this.totalAccesses = this.accessHistory.length
  }
}

/**
 * 创建预测缓存实例
 * 
 * @param config - 配置选项
 * @returns 预测缓存实例
 */
export function createPredictiveCache(config?: PredictiveCacheConfig): PredictiveCache {
  return new PredictiveCache(config)
}


