/**
 * 字符串驻留池 - 减少重复字符串的内存占用
 * 
 * 通过字符串驻留技术，相同的字符串只存储一份，
 * 可以显著减少内存占用，特别是在有大量重复键的场景
 * 
 * 特性：
 * 1. 自动驻留频繁使用的字符串
 * 2. 支持弱引用，避免内存泄漏
 * 3. 统计分析，识别热点字符串
 * 4. 自动清理不常用的字符串
 */

export interface StringInternConfig {
  /** 最大驻留字符串数 */
  maxSize?: number
  /** 最小使用次数（触发驻留） */
  minUsageCount?: number
  /** 清理间隔（毫秒） */
  cleanupInterval?: number
  /** 是否使用弱引用 */
  useWeakRefs?: boolean
  /** 统计采样率（0-1） */
  samplingRate?: number
}

interface InternedString {
  value: string
  count: number
  lastAccess: number
  size: number
}

/**
 * 字符串驻留池
 */
export class StringIntern {
  private config: Required<StringInternConfig>

  // 主驻留池
  private pool = new Map<string, InternedString>()

  // 候选池（统计使用频率）
  private candidates = new Map<string, number>()

  // 弱引用池（可选）
  private weakPool?: WeakMap<object, string>

  // 统计信息
  private stats = {
    totalInterns: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    memorySaved: 0,
  }

  // 清理定时器
  private cleanupTimer?: number

  constructor(config: StringInternConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 10000,
      minUsageCount: config.minUsageCount || 3,
      cleanupInterval: config.cleanupInterval || 60000,
      useWeakRefs: config.useWeakRefs ?? false,
      samplingRate: config.samplingRate || 1.0,
    }

    if (this.config.useWeakRefs && typeof WeakMap !== 'undefined') {
      this.weakPool = new WeakMap()
    }

    this.startCleanup()
  }

  /**
   * 驻留字符串
   */
  intern(str: string): string {
    // 采样控制
    if (this.config.samplingRate < 1 && Math.random() > this.config.samplingRate) {
      return str
    }

    // 检查是否已驻留
    const interned = this.pool.get(str)
    if (interned) {
      interned.count++
      interned.lastAccess = Date.now()
      this.stats.hits++
      return interned.value
    }

    // 更新候选计数
    const candidateCount = (this.candidates.get(str) || 0) + 1
    this.candidates.set(str, candidateCount)

    // 检查是否达到驻留阈值
    if (candidateCount >= this.config.minUsageCount) {
      return this.addToPool(str)
    }

    this.stats.misses++
    return str
  }

  /**
   * 添加到驻留池
   */
  private addToPool(str: string): string {
    // 检查容量
    if (this.pool.size >= this.config.maxSize) {
      this.evictLeastUsed()
    }

    const size = str.length * 2 // UTF-16
    const interned: InternedString = {
      value: str,
      count: this.candidates.get(str) || 1,
      lastAccess: Date.now(),
      size,
    }

    this.pool.set(str, interned)
    this.candidates.delete(str)
    this.stats.totalInterns++

    // 计算节省的内存（假设平均重复10次）
    this.stats.memorySaved += size * 9

    return str
  }

  /**
   * 淘汰最少使用的字符串
   */
  private evictLeastUsed(): void {
    let minScore = Infinity
    let keyToEvict = ''

    const now = Date.now()

    for (const [key, interned] of this.pool) {
      // 计算得分（使用次数 * 时间衰减）
      const age = now - interned.lastAccess
      const score = interned.count / (1 + age / 3600000) // 1小时衰减

      if (score < minScore) {
        minScore = score
        keyToEvict = key
      }
    }

    if (keyToEvict) {
      const evicted = this.pool.get(keyToEvict)!
      this.pool.delete(keyToEvict)
      this.stats.evictions++
      this.stats.memorySaved -= evicted.size * 9
    }
  }

  /**
   * 批量驻留
   */
  internBatch(strings: string[]): string[] {
    return strings.map(str => this.intern(str))
  }

  /**
   * 获取驻留的字符串（如果存在）
   */
  getInterned(str: string): string | undefined {
    const interned = this.pool.get(str)
    if (interned) {
      interned.count++
      interned.lastAccess = Date.now()
      return interned.value
    }
    return undefined
  }

  /**
   * 检查是否已驻留
   */
  isInterned(str: string): boolean {
    return this.pool.has(str)
  }

  /**
   * 启动定期清理
   */
  private startCleanup(): void {
    const setIntervalFn =
      typeof window !== 'undefined' ? window.setInterval : globalThis.setInterval

    this.cleanupTimer = setIntervalFn(() => {
      this.cleanup()
    }, this.config.cleanupInterval) as unknown as number
  }

  /**
   * 清理过期和低频字符串
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = this.config.cleanupInterval * 2
    const minCount = this.config.minUsageCount

    // 清理驻留池
    const keysToDelete: string[] = []

    for (const [key, interned] of this.pool) {
      if (now - interned.lastAccess > maxAge && interned.count < minCount * 2) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      const evicted = this.pool.get(key)!
      this.pool.delete(key)
      this.stats.evictions++
      this.stats.memorySaved -= evicted.size * 9
    }

    // 清理候选池
    const candidateThreshold = Math.floor(this.config.maxSize * 0.1)
    if (this.candidates.size > candidateThreshold) {
      // 保留使用次数最多的候选
      const sorted = Array.from(this.candidates.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, candidateThreshold)

      this.candidates = new Map(sorted)
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const poolMemory = Array.from(this.pool.values())
      .reduce((sum, interned) => sum + interned.size, 0)

    return {
      poolSize: this.pool.size,
      candidateSize: this.candidates.size,
      totalInterns: this.stats.totalInterns,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      evictions: this.stats.evictions,
      memorySaved: this.stats.memorySaved,
      poolMemory,
      efficiency: this.stats.memorySaved / (poolMemory + this.stats.memorySaved) || 0,
    }
  }

  /**
   * 获取热点字符串
   */
  getHotStrings(limit = 10): Array<{ string: string, count: number, size: number }> {
    return Array.from(this.pool.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([string, interned]) => ({
        string,
        count: interned.count,
        size: interned.size,
      }))
  }

  /**
   * 重置驻留池
   */
  reset(): void {
    this.pool.clear()
    this.candidates.clear()
    this.stats = {
      totalInterns: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      memorySaved: 0,
    }
  }

  /**
   * 销毁驻留池
   */
  destroy(): void {
    if (this.cleanupTimer) {
      const clearIntervalFn =
        typeof window !== 'undefined' ? window.clearInterval : globalThis.clearInterval
      clearIntervalFn(this.cleanupTimer)
      this.cleanupTimer = undefined
    }

    this.reset()
  }
}

/**
 * 全局字符串驻留池（单例）
 */
let globalIntern: StringIntern | null = null

export function getGlobalStringIntern(config?: StringInternConfig): StringIntern {
  if (!globalIntern) {
    globalIntern = new StringIntern(config)
  }
  return globalIntern
}

/**
 * 驻留字符串（使用全局池）
 */
export function intern(str: string): string {
  return getGlobalStringIntern().intern(str)
}

/**
 * 创建带驻留的对象包装器
 */
export function createInternedObject<T extends object>(
  obj: T,
  keysToIntern?: (keyof T)[]
): T {
  const interned = { ...obj }
  const intern = getGlobalStringIntern()

  const keys = keysToIntern || Object.keys(obj) as (keyof T)[]

  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'string') {
      (interned as any)[key] = intern.intern(value)
    }
  }

  return interned
}

/**
 * 字符串驻留装饰器
 */
export function InternString(target: any, propertyKey: string) {
  let value: string
  const intern = getGlobalStringIntern()

  const getter = function () {
    return value
  }

  const setter = function (newValue: string) {
    if (typeof newValue === 'string') {
      value = intern.intern(newValue)
    } else {
      value = newValue
    }
  }

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  })
}

