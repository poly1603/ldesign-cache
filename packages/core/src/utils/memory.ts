/**
 * 内存估算工具函数
 * @module @ldesign/cache/core/utils/memory
 */

/**
 * JavaScript 基础类型的内存开销（字节）
 */
const MEMORY_OVERHEAD = {
  /** 对象基础开销 */
  OBJECT_BASE: 32,
  /** 数组基础开销 */
  ARRAY_BASE: 32,
  /** 字符串基础开销 */
  STRING_BASE: 40,
  /** 数字（64位浮点） */
  NUMBER: 8,
  /** 布尔值 */
  BOOLEAN: 4,
  /** null/undefined */
  NULL: 0,
  /** 每个对象属性的开销 */
  PROPERTY_OVERHEAD: 32,
  /** Map/Set 基础开销 */
  MAP_BASE: 80,
  /** Date 对象 */
  DATE: 48,
  /** 正则表达式基础开销 */
  REGEX_BASE: 64,
} as const

/**
 * 估算任意 JavaScript 值的内存占用（字节）
 * 
 * 使用深度遍历算法，避免循环引用导致的无限递归
 * 
 * @param value - 要估算的值
 * @param seen - 已访问对象集合（用于检测循环引用）
 * @returns 估算的内存占用字节数
 * 
 * @example
 * ```typescript
 * const obj = { name: '张三', age: 25, scores: [90, 85, 92] }
 * const size = estimateMemoryUsage(obj)
 * console.log(`估算内存占用: ${size} 字节`)
 * ```
 */
export function estimateMemoryUsage(value: unknown, seen = new WeakSet<object>()): number {
  // null 和 undefined
  if (value === null || value === undefined) {
    return MEMORY_OVERHEAD.NULL
  }

  const type = typeof value

  // 基础类型
  switch (type) {
    case 'boolean':
      return MEMORY_OVERHEAD.BOOLEAN
    case 'number':
      return MEMORY_OVERHEAD.NUMBER
    case 'string':
      // 字符串：基础开销 + 每个字符 2 字节（UTF-16）
      return MEMORY_OVERHEAD.STRING_BASE + (value as string).length * 2
    case 'bigint':
      // BigInt：估算每 64 位需要 8 字节
      return Math.ceil((value as bigint).toString(2).length / 64) * 8
    case 'symbol':
      return 8 // Symbol 引用
    case 'function':
      return 0 // 函数通常不计入缓存大小
  }

  // 对象类型
  if (type === 'object') {
    const obj = value as object

    // 检测循环引用
    if (seen.has(obj)) {
      return 8 // 仅计算引用大小
    }
    seen.add(obj)

    // ArrayBuffer 和 TypedArray
    if (obj instanceof ArrayBuffer) {
      return obj.byteLength
    }
    if (ArrayBuffer.isView(obj)) {
      return (obj as unknown as ArrayBufferView).byteLength
    }

    // Date
    if (obj instanceof Date) {
      return MEMORY_OVERHEAD.DATE
    }

    // RegExp
    if (obj instanceof RegExp) {
      return MEMORY_OVERHEAD.REGEX_BASE + obj.source.length * 2
    }

    // Map
    if (obj instanceof Map) {
      let size = MEMORY_OVERHEAD.MAP_BASE
      for (const [key, val] of obj) {
        size += estimateMemoryUsage(key, seen) + estimateMemoryUsage(val, seen)
      }
      return size
    }

    // Set
    if (obj instanceof Set) {
      let size = MEMORY_OVERHEAD.MAP_BASE
      for (const item of obj) {
        size += estimateMemoryUsage(item, seen)
      }
      return size
    }

    // Array
    if (Array.isArray(obj)) {
      let size = MEMORY_OVERHEAD.ARRAY_BASE
      for (const item of obj) {
        size += estimateMemoryUsage(item, seen) + 8 // 每个元素的引用开销
      }
      return size
    }

    // 普通对象
    let size = MEMORY_OVERHEAD.OBJECT_BASE
    for (const key of Object.keys(obj)) {
      // 属性名的内存
      size += MEMORY_OVERHEAD.STRING_BASE + key.length * 2
      // 属性值的内存
      size += estimateMemoryUsage((obj as Record<string, unknown>)[key], seen)
      // 属性槽位开销
      size += MEMORY_OVERHEAD.PROPERTY_OVERHEAD
    }
    return size
  }

  return 0
}

/**
 * 格式化字节大小为人类可读的字符串
 * 
 * @param bytes - 字节数
 * @param decimals - 小数位数，默认为 2
 * @returns 格式化后的字符串
 * 
 * @example
 * ```typescript
 * formatBytes(1024)      // '1 KB'
 * formatBytes(1234567)   // '1.18 MB'
 * formatBytes(0)         // '0 Bytes'
 * ```
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return '0 Bytes'
  }

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const index = Math.min(i, sizes.length - 1)

  return `${Number.parseFloat((bytes / k ** index).toFixed(dm))} ${sizes[index]}`
}

/**
 * 计算缓存项的总内存占用
 * 
 * 包括键、值、元数据等所有相关数据
 * 
 * @param key - 缓存键
 * @param value - 缓存值
 * @param metadata - 额外的元数据对象
 * @returns 估算的总内存占用字节数
 */
export function estimateCacheItemSize(
  key: string,
  value: unknown,
  metadata?: object,
): number {
  let size = 0

  // 键的大小
  size += MEMORY_OVERHEAD.STRING_BASE + key.length * 2

  // 值的大小
  size += estimateMemoryUsage(value)

  // 元数据的大小
  if (metadata) {
    size += estimateMemoryUsage(metadata)
  }

  // CacheItem 包装器的固定开销（时间戳、计数器等）
  // createdAt, lastAccessedAt, accessCount, expiresAt, ttl
  size += MEMORY_OVERHEAD.NUMBER * 5

  return size
}

/**
 * 内存使用追踪器
 * 
 * 用于实时追踪缓存的内存使用情况
 */
export class MemoryTracker {
  private totalSize = 0
  private itemSizes = new Map<string, number>()

  /**
   * 记录新增或更新的缓存项
   * 
   * @param key - 缓存键
   * @param value - 缓存值
   * @param metadata - 元数据
   */
  track(key: string, value: unknown, metadata?: object): void {
    // 先移除旧的记录（如果存在）
    this.untrack(key)

    // 计算新的大小
    const size = estimateCacheItemSize(key, value, metadata)
    this.itemSizes.set(key, size)
    this.totalSize += size
  }

  /**
   * 移除缓存项的内存记录
   * 
   * @param key - 缓存键
   */
  untrack(key: string): void {
    const oldSize = this.itemSizes.get(key)
    if (oldSize !== undefined) {
      this.totalSize -= oldSize
      this.itemSizes.delete(key)
    }
  }

  /**
   * 清空所有记录
   */
  clear(): void {
    this.itemSizes.clear()
    this.totalSize = 0
  }

  /**
   * 获取总内存占用
   */
  get total(): number {
    return this.totalSize
  }

  /**
   * 获取缓存项数量
   */
  get count(): number {
    return this.itemSizes.size
  }

  /**
   * 获取平均每项内存占用
   */
  get average(): number {
    if (this.itemSizes.size === 0) {
      return 0
    }
    return this.totalSize / this.itemSizes.size
  }

  /**
   * 获取指定缓存项的内存占用
   * 
   * @param key - 缓存键
   * @returns 内存占用字节数，不存在返回 undefined
   */
  getSize(key: string): number | undefined {
    return this.itemSizes.get(key)
  }

  /**
   * 获取格式化的总内存占用
   */
  getFormattedTotal(): string {
    return formatBytes(this.totalSize)
  }

  /**
   * 获取内存统计摘要
   */
  getSummary(): MemoryTrackerSummary {
    const sizes = Array.from(this.itemSizes.values())
    sizes.sort((a, b) => a - b)

    return {
      total: this.totalSize,
      count: this.itemSizes.size,
      average: this.average,
      min: sizes[0] ?? 0,
      max: sizes[sizes.length - 1] ?? 0,
      median: sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 0,
      formatted: {
        total: this.getFormattedTotal(),
        average: formatBytes(this.average),
      },
    }
  }
}

/**
 * 内存追踪器统计摘要
 */
export interface MemoryTrackerSummary {
  /** 总内存占用（字节） */
  total: number
  /** 缓存项数量 */
  count: number
  /** 平均每项内存占用（字节） */
  average: number
  /** 最小项内存占用（字节） */
  min: number
  /** 最大项内存占用（字节） */
  max: number
  /** 中位数内存占用（字节） */
  median: number
  /** 格式化的字符串 */
  formatted: {
    total: string
    average: string
  }
}
