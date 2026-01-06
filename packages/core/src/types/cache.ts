/**
 * 缓存相关类型定义
 * @module @ldesign/cache/core/types/cache
 */

/**
 * 缓存值约束 - 可缓存的值类型
 * 排除 undefined、函数和 Symbol 等不可序列化的类型
 */
export type CacheableValue = 
  | string 
  | number 
  | boolean 
  | null 
  | CacheableValue[] 
  | { [key: string]: CacheableValue }
  | Date
  | ArrayBuffer
  | Blob

/**
 * 缓存项元数据
 * 与值分离的元信息，用于管理和统计
 */
export interface CacheItemMetadata {
  /** 创建时间戳（毫秒） */
  createdAt: number
  /** 最后访问时间戳（毫秒） */
  lastAccessedAt: number
  /** 访问次数 */
  accessCount: number
  /** 过期时间戳（毫秒），undefined 表示永不过期 */
  expiresAt?: number
  /** TTL 时长（毫秒） */
  ttl?: number
  /** 缓存标签，用于批量清理 */
  tags?: string[]
  /** 缓存命名空间 */
  namespace?: string
  /** 缓存版本号 */
  version?: number
  /** 依赖的其他缓存键 */
  dependencies?: string[]
  /** 数据大小（字节，估算值） */
  size?: number
  /** 优先级（用于淘汰决策，数值越大优先级越高） */
  priority?: number
}

/**
 * 缓存项接口
 * @template T - 缓存值的类型，默认为 unknown 以强制类型检查
 */
export interface CacheItem<T = unknown> extends CacheItemMetadata {
  /** 缓存的键 */
  readonly key: string
  /** 缓存的值 */
  value: T
}

/**
 * 只读缓存项（用于查询返回）
 */
export type ReadonlyCacheItem<T = unknown> = Readonly<CacheItem<T>>

/**
 * 缓存策略枚举
 */
export enum CacheStrategy {
  /** 最近最少使用 - 淘汰最久未使用的项 */
  LRU = 'lru',
  /** 最不经常使用 - 淘汰访问频率最低的项 */
  LFU = 'lfu',
  /** 先进先出 - 淘汰最早添加的项 */
  FIFO = 'fifo',
  /** 基于过期时间 - 自动清理过期项 */
  TTL = 'ttl',
  /** 自适应替换缓存 - 综合 LRU 和 LFU 的优点 */
  ARC = 'arc',
}

/**
 * 存储类型
 */
export type StorageType = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB'

/**
 * 缓存配置选项
 * @template T - 缓存值类型约束
 */
export interface CacheOptions<T = unknown> {
  /** 缓存策略，默认 LRU */
  strategy?: CacheStrategy
  /** 最大缓存容量，默认 100 */
  maxSize?: number
  /** 默认 TTL（毫秒），undefined 表示永不过期 */
  defaultTTL?: number
  /** 是否启用统计，默认 true */
  enableStats?: boolean
  /** 是否启用持久化，默认 false */
  enablePersistence?: boolean
  /** 持久化存储类型 */
  storageType?: StorageType
  /** 持久化键前缀 */
  storagePrefix?: string
  /** 自动清理间隔（毫秒），0 表示禁用自动清理 */
  cleanupInterval?: number
  /** 缓存命名空间 */
  namespace?: string
  /** 序列化器 */
  serializer?: Serializer<T>
  /** 是否启用压缩 */
  enableCompression?: boolean
  /** 压缩阈值（字节），超过此大小才压缩 */
  compressionThreshold?: number
  /** 是否启用加密 */
  enableEncryption?: boolean
  /** 加密密钥 */
  encryptionKey?: string
  /** 插件列表 */
  plugins?: CachePlugin<T>[]
  /** 淘汰时的回调函数 */
  onEvict?: (key: string, value: T, reason: EvictionReason) => void
  /** 过期时的回调函数 */
  onExpire?: (key: string, value: T) => void
  /** 错误处理函数 */
  onError?: (error: CacheError) => void
}

/**
 * 淘汰原因
 */
export type EvictionReason = 'capacity' | 'expired' | 'manual' | 'lru' | 'lfu' | 'fifo'

/**
 * 缓存错误
 */
export interface CacheError extends Error {
  /** 错误代码 */
  code: CacheErrorCode
  /** 相关的键 */
  key?: string
  /** 原始错误 */
  cause?: Error
}

/**
 * 缓存错误代码
 */
export enum CacheErrorCode {
  /** 序列化失败 */
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  /** 反序列化失败 */
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  /** 存储已满 */
  STORAGE_FULL = 'STORAGE_FULL',
  /** 存储不可用 */
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  /** 加密失败 */
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',
  /** 解密失败 */
  DECRYPTION_ERROR = 'DECRYPTION_ERROR',
  /** 压缩失败 */
  COMPRESSION_ERROR = 'COMPRESSION_ERROR',
  /** 解压失败 */
  DECOMPRESSION_ERROR = 'DECOMPRESSION_ERROR',
  /** 无效的键 */
  INVALID_KEY = 'INVALID_KEY',
  /** 无效的值 */
  INVALID_VALUE = 'INVALID_VALUE',
  /** 无效的 TTL */
  INVALID_TTL = 'INVALID_TTL',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 序列化器接口
 * @template T - 要序列化的值类型
 */
export interface Serializer<T = unknown> {
  /** 序列化器名称 */
  readonly name: string
  /** 序列化 */
  serialize(value: T): string | ArrayBuffer
  /** 反序列化 */
  deserialize(data: string | ArrayBuffer): T
  /** 检查是否支持该值类型 */
  canSerialize?(value: unknown): value is T
}

/**
 * 缓存插件接口
 * @template T - 缓存值类型
 */
export interface CachePlugin<T = unknown> {
  /** 插件名称 */
  readonly name: string
  /** 插件版本 */
  readonly version?: string
  /** 插件初始化 */
  init?(cache: CachePluginContext<T>): void | Promise<void>
  /** 在设置缓存前调用 */
  beforeSet?(key: string, value: T, options?: SetOptions): { key: string, value: T, options?: SetOptions } | void
  /** 在设置缓存后调用 */
  afterSet?(key: string, value: T, options?: SetOptions): void
  /** 在获取缓存前调用 */
  beforeGet?(key: string): string | void
  /** 在获取缓存后调用 */
  afterGet?(key: string, value: T | undefined): T | undefined | void
  /** 在删除缓存前调用 */
  beforeDelete?(key: string): string | void
  /** 在删除缓存后调用 */
  afterDelete?(key: string, success: boolean): void
  /** 在清空缓存前调用 */
  beforeClear?(): void
  /** 在清空缓存后调用 */
  afterClear?(): void
  /** 插件销毁 */
  destroy?(): void | Promise<void>
}

/**
 * 设置选项
 */
export interface SetOptions {
  /** TTL（毫秒） */
  ttl?: number
  /** 标签 */
  tags?: string[]
  /** 优先级 */
  priority?: number
  /** 是否跳过序列化 */
  skipSerialization?: boolean
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 当前缓存项数量 */
  size: number
  /** 最大容量 */
  maxSize: number
  /** 总请求次数 */
  totalRequests: number
  /** 命中次数 */
  hits: number
  /** 未命中次数 */
  misses: number
  /** 命中率（0-1） */
  hitRate: number
  /** 淘汰次数 */
  evictions: number
  /** 过期清理次数 */
  expirations: number
  /** 总内存占用（字节，估算值） */
  memoryUsage: number
  /** 平均响应时间（毫秒） */
  avgResponseTime?: number
  /** P95 响应时间（毫秒） */
  p95ResponseTime?: number
  /** P99 响应时间（毫秒） */
  p99ResponseTime?: number
  /** 最后更新时间 */
  lastUpdated?: number
}

/**
 * 缓存插件上下文
 */
export interface CachePluginContext<T = unknown> {
  /** 获取缓存统计 */
  getStats(): CacheStats
  /** 获取缓存大小 */
  readonly size: number
  /** 获取所有键 */
  keys(): string[]
}

/**
 * 批量操作选项
 * @template T - 操作值类型
 */
export interface BatchOptions<T = unknown> {
  /** 是否在遇到错误时继续执行后续操作 */
  continueOnError?: boolean
  /** 批量操作的默认 TTL（毫秒） */
  ttl?: number
  /** 批量操作的标签 */
  tags?: string[]
  /** 并发数量限制（默认无限制） */
  concurrency?: number
  /** 单项操作超时时间（毫秒） */
  timeout?: number
  /** 进度回调 */
  onProgress?: (completed: number, total: number, key: string) => void
}

/**
 * 批量操作结果
 * @template T - 结果值类型
 */
export interface BatchResult<T = unknown> {
  /** 成功操作的键列表 */
  succeeded: string[]
  /** 失败操作的详情列表 */
  failed: Array<BatchFailure>
  /** 操作结果映射 */
  results: Map<string, T>
  /** 总耗时（毫秒） */
  duration: number
  /** 是否全部成功 */
  readonly allSucceeded: boolean
}

/**
 * 批量操作失败详情
 */
export interface BatchFailure {
  /** 失败的键 */
  key: string
  /** 错误对象 */
  error: Error
  /** 错误代码 */
  code?: CacheErrorCode
}

/**
 * 批量设置条目
 * @template T - 值类型
 */
export interface BatchSetEntry<T = unknown> {
  /** 缓存键 */
  key: string
  /** 缓存值 */
  value: T
  /** 该项的 TTL（覆盖批量选项中的默认值） */
  ttl?: number
  /** 该项的标签 */
  tags?: string[]
}

