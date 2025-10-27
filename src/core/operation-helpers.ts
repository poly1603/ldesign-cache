/**
 * 缓存操作辅助工具
 * 
 * 提供通用的操作辅助函数，减少重复代码
 */

import type { CacheMetadata, SerializableValue, StorageEngine } from '../types'

/**
 * 检查并处理缓存项过期
 * 
 * 统一的过期检查逻辑，避免在多处重复相同的检查代码
 * 
 * @param metadata - 缓存元数据
 * @param onExpired - 过期时的回调函数
 * @returns true表示已过期，false表示未过期
 * 
 * @example
 * ```typescript
 * if (checkExpiration(metadata, () => {
 *   // 清理过期项
 *   await engine.removeItem(key)
 *   emitEvent('expired', key, engine)
 * })) {
 *   return null
 * }
 * ```
 */
export function checkExpiration(
  metadata: CacheMetadata,
  onExpired: () => void | Promise<void>,
): boolean {
  if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
    // 异步执行清理回调（不阻塞主流程）
    Promise.resolve(onExpired()).catch((error) => {
      console.warn('Failed to handle expired item:', error)
    })
    return true
  }
  return false
}

/**
 * 统计更新器
 * 
 * 统一管理引擎访问统计的更新逻辑
 */
export class StatsUpdater {
  /**
   * 创建统计更新器
   * 
   * @param stats - 统计数据Map
   */
  constructor(
    private stats: Map<StorageEngine, { hits: number, misses: number }>,
  ) { }

  /**
   * 记录命中
   * 
   * @param engine - 存储引擎类型
   */
  recordHit(engine: StorageEngine): void {
    const stat = this.stats.get(engine)
    if (stat) {
      stat.hits++
    }
  }

  /**
   * 记录未命中
   * 
   * @param engine - 存储引擎类型
   */
  recordMiss(engine: StorageEngine): void {
    const stat = this.stats.get(engine)
    if (stat) {
      stat.misses++
    }
  }

  /**
   * 批量记录命中
   * 
   * @param engine - 存储引擎类型
   * @param count - 命中次数
   */
  recordHits(engine: StorageEngine, count: number): void {
    const stat = this.stats.get(engine)
    if (stat) {
      stat.hits += count
    }
  }

  /**
   * 批量记录未命中
   * 
   * @param engine - 存储引擎类型
   * @param count - 未命中次数
   */
  recordMisses(engine: StorageEngine, count: number): void {
    const stat = this.stats.get(engine)
    if (stat) {
      stat.misses += count
    }
  }

  /**
   * 获取指定引擎的统计
   * 
   * @param engine - 存储引擎类型
   * @returns 统计信息或undefined
   */
  getStats(engine: StorageEngine): { hits: number, misses: number } | undefined {
    return this.stats.get(engine)
  }

  /**
   * 获取所有引擎的统计
   * 
   * @returns 所有统计信息
   */
  getAllStats(): Record<string, { hits: number, misses: number }> {
    const result: Record<string, { hits: number, misses: number }> = {}

    for (const [engine, stat] of this.stats) {
      result[engine] = { ...stat }
    }

    return result
  }

  /**
   * 重置统计
   * 
   * @param engine - 可选，指定要重置的引擎，不指定则重置所有
   */
  reset(engine?: StorageEngine): void {
    if (engine) {
      const stat = this.stats.get(engine)
      if (stat) {
        stat.hits = 0
        stat.misses = 0
      }
    }
    else {
      for (const stat of this.stats.values()) {
        stat.hits = 0
        stat.misses = 0
      }
    }
  }
}

/**
 * 批量操作结果聚合器
 */
export class ResultAggregator {
  private successKeys: string[] = []
  private failedItems: Array<{ key: string, error: Error, index: number }> = []

  /**
   * 添加成功项
   * 
   * @param key - 成功的键
   */
  addSuccess(key: string): void {
    this.successKeys.push(key)
  }

  /**
   * 添加失败项
   * 
   * @param key - 失败的键
   * @param error - 错误对象
   * @param index - 原始索引
   */
  addFailure(key: string, error: Error, index: number): void {
    this.failedItems.push({ key, error, index })
  }

  /**
   * 批量添加成功项
   * 
   * @param keys - 成功的键数组
   */
  addSuccesses(keys: string[]): void {
    this.successKeys.push(...keys)
  }

  /**
   * 批量添加失败项
   * 
   * @param failures - 失败项数组
   */
  addFailures(failures: Array<{ key: string, error: Error, index: number }>): void {
    this.failedItems.push(...failures)
  }

  /**
   * 获取聚合结果
   * 
   * @returns 批量操作结果
   */
  getResult(): {
    success: string[]
    failed: Array<{ key: string, error: Error }>
  } {
    return {
      success: this.successKeys,
      failed: this.failedItems,
    }
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计信息
   */
  getStats(): {
    totalSuccess: number
    totalFailed: number
    successRate: number
  } {
    const total = this.successKeys.length + this.failedItems.length

    return {
      totalSuccess: this.successKeys.length,
      totalFailed: this.failedItems.length,
      successRate: total > 0 ? this.successKeys.length / total : 0,
    }
  }
}

/**
 * 过期项检查器
 * 
 * 批量检查和处理过期项
 */
export class ExpirationChecker {
  /**
   * 批量检查过期项
   * 
   * @param items - 要检查的项（包含metadata）
   * @param now - 当前时间戳（可选，默认为Date.now()）
   * @returns 未过期的项索引集合
   */
  static filterExpired<T extends { metadata: CacheMetadata }>(
    items: T[],
    now: number = Date.now(),
  ): { valid: T[], expired: T[] } {
    const valid: T[] = []
    const expired: T[] = []

    for (const item of items) {
      if (item.metadata.expiresAt && now > item.metadata.expiresAt) {
        expired.push(item)
      }
      else {
        valid.push(item)
      }
    }

    return { valid, expired }
  }

  /**
   * 检查单个项是否过期
   * 
   * @param expiresAt - 过期时间戳
   * @param now - 当前时间戳（可选）
   * @returns 是否过期
   */
  static isExpired(expiresAt: number | undefined, now: number = Date.now()): boolean {
    return expiresAt !== undefined && now > expiresAt
  }

  /**
   * 计算剩余TTL
   * 
   * @param expiresAt - 过期时间戳
   * @param now - 当前时间戳（可选）
   * @returns 剩余TTL（毫秒），已过期返回0
   */
  static getRemainingTTL(expiresAt: number | undefined, now: number = Date.now()): number {
    if (!expiresAt) {
      return Infinity
    }
    return Math.max(0, expiresAt - now)
  }
}

/**
 * 键处理器
 * 
 * 统一的键处理逻辑（前缀、混淆等）
 */
export class KeyProcessor {
  /**
   * 批量处理键
   * 
   * @param keys - 原始键数组
   * @param processor - 处理函数（单个键）
   * @returns 处理后的键数组
   */
  static async processBatch(
    keys: string[],
    processor: (key: string) => Promise<string>,
  ): Promise<string[]> {
    return Promise.all(keys.map(key => processor(key)))
  }

  /**
   * 批量反处理键
   * 
   * @param keys - 处理后的键数组
   * @param unprocessor - 反处理函数（单个键）
   * @returns 原始键数组
   */
  static async unprocessBatch(
    keys: string[],
    unprocessor: (key: string) => Promise<string>,
  ): Promise<string[]> {
    return Promise.all(keys.map(key => unprocessor(key)))
  }
}


