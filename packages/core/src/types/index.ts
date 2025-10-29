/**
 * 核心类型定义
 */

// 基础类型
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue }

// 存储引擎类型
export type StorageEngine =
  | 'memory'
  | 'localStorage'
  | 'sessionStorage'
  | 'indexedDB'
  | 'cookie'
  | 'opfs'

// 缓存选项
export interface CacheOptions {
  defaultEngine?: StorageEngine
  defaultTTL?: number
  enablePerformanceTracking?: boolean
  security?: {
    encryption?: { enabled: boolean }
    obfuscation?: { enabled: boolean }
  }
}

// 设置选项
export interface SetOptions {
  ttl?: number
  engine?: StorageEngine
  tags?: string[]
  priority?: number
}

// 缓存统计
export interface CacheStats {
  totalKeys: number
  hits: number
  misses: number
  hitRate: number
}

// 缓存项
export interface CacheItem<T = SerializableValue> {
  key: string
  value: T
  ttl?: number
  createdAt: number
  accessedAt: number
  engine: StorageEngine
}

// 存储引擎接口
export interface IStorageEngine {
  get<T = SerializableValue>(key: string): Promise<T | null>
  set<T = SerializableValue>(key: string, value: T, options?: SetOptions): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
}

