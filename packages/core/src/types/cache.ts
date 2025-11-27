/**
 * 缓存相关类型定义
 * @module @ldesign/cache/core/types/cache
 */

/**
 * 缓存项接口
 * @template T - 缓存值的类型
 */
export interface CacheItem<T = any> {
  /** 缓存的键 */
  key: string
  /** 缓存的值 */
  value: T
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
  /** 缓存版本 */
  version?: number
  /** 依赖的其他缓存键 */
  dependencies?: string[]
}

/**
 * 缓存配置选项
 */
export interface CacheOptions {
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
  storageType?: 'localStorage' | 'sessionStorage' | 'indexedDB'
  /** 持久化键前缀 */
  storagePrefix?: string
  /** 自动清理间隔（毫秒），0 表示禁用自动清理 */
  cleanupInterval?: number
  /** 缓存命名空间 */
  namespace?: string
  /** 序列化器 */
  serializer?: Serializer
  /** 是否启用压缩 */
  enableCompression?: boolean
  /** 是否启用加密 */
  enableEncryption?: boolean
  /** 加密密钥 */
  encryptionKey?: string
  /** 插件列表 */
  plugins?: CachePlugin[]
}

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
}

/**
 * 序列化器接口
 */
export interface Serializer {
  /** 序列化 */
  serialize<T>(value: T): string
  /** 反序列化 */
  deserialize<T>(data: string): T
}

/**
 * 缓存插件接口
 */
export interface CachePlugin {
  /** 插件名称 */
  name: string
  /** 插件初始化 */
  init?: (cache: any) => void
  /** 在设置缓存前调用 */
  beforeSet?: <T>(key: string, value: T, options?: any) => { key: string, value: T, options?: any } | void
  /** 在设置缓存后调用 */
  afterSet?: <T>(key: string, value: T, options?: any) => void
  /** 在获取缓存前调用 */
  beforeGet?: (key: string) => string | void
  /** 在获取缓存后调用 */
  afterGet?: <T>(key: string, value: T | undefined) => T | undefined | void
  /** 在删除缓存前调用 */
  beforeDelete?: (key: string) => string | void
  /** 在删除缓存后调用 */
  afterDelete?: (key: string, success: boolean) => void
  /** 在清空缓存前调用 */
  beforeClear?: () => void
  /** 在清空缓存后调用 */
  afterClear?: () => void
  /** 插件销毁 */
  destroy?: () => void
}

/**
 * 批量操作选项
 */
export interface BatchOptions {
  /** 是否忽略错误继续执行 */
  continueOnError?: boolean
  /** 批量操作的 TTL */
  ttl?: number
  /** 批量操作的标签 */
  tags?: string[]
}

/**
 * 批量操作结果
 */
export interface BatchResult<T = any> {
  /** 成功的键 */
  succeeded: string[]
  /** 失败的键及错误信息 */
  failed: Array<{ key: string, error: Error }>
  /** 操作结果 */
  results: Map<string, T>
}

