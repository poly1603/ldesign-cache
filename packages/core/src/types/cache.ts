/**
 * Cache type definitions.
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

export interface CacheItemMetadata {
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt?: number
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  size?: number
}

export interface CacheItem<T = unknown> extends CacheItemMetadata {
  readonly key: string
  value: T
}

export type ReadonlyCacheItem<T = unknown> = Readonly<CacheItem<T>>

export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  FIFO = 'fifo',
  TTL = 'ttl',
}

/**
 * Persistence backend supported by CacheManager itself.
 */
export type StorageType = 'localStorage' | 'sessionStorage'

export type EvictionReason = 'capacity' | 'expired' | 'manual' | 'lru' | 'lfu' | 'fifo' | 'strategy'

export interface CacheOptions<T = unknown> {
  strategy?: CacheStrategy
  maxSize?: number
  defaultTTL?: number
  enableStats?: boolean
  enablePersistence?: boolean
  storageType?: StorageType
  storagePrefix?: string
  cleanupInterval?: number
  namespace?: string
  plugins?: CachePlugin<T>[]
  onEvict?: (key: string, value: T, reason: EvictionReason) => void
  onExpire?: (key: string, value: T) => void
  onError?: (error: CacheError) => void
}

export interface SetOptions {
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
}

export interface CacheStats {
  size: number
  maxSize: number
  totalRequests: number
  hits: number
  misses: number
  hitRate: number
  evictions: number
  expirations: number
  memoryUsage: number
  lastUpdated?: number
}

export interface CacheError extends Error {
  code: CacheErrorCode
  key?: string
  cause?: Error
}

export enum CacheErrorCode {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  INVALID_KEY = 'INVALID_KEY',
  INVALID_TTL = 'INVALID_TTL',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface Serializer<T = unknown> {
  readonly name: string
  serialize(value: T): string | ArrayBuffer
  deserialize(data: string | ArrayBuffer): T
  canSerialize?(value: unknown): value is T
}

export interface CachePluginContext<T = unknown> {
  getStats(): CacheStats
  readonly size: number
  keys(): string[]
  has(key: string): boolean
  get(key: string): T | undefined
  delete(key: string): boolean
}

export interface CachePluginSetInput<T = unknown> {
  key: string
  value: T
  options?: SetOptions
}

export interface CachePlugin<T = unknown> {
  readonly name: string
  readonly version?: string
  init?(cache: CachePluginContext<T>): void | Promise<void>
  beforeSet?(key: string, value: T, options?: SetOptions): CachePluginSetInput<T> | void
  afterSet?(key: string, value: T, options?: SetOptions): void
  beforeGet?(key: string): string | void
  afterGet?(key: string, value: T | undefined): T | undefined | void
  beforeDelete?(key: string): string | void
  afterDelete?(key: string, success: boolean, reason?: EvictionReason): void
  beforeClear?(): void
  afterClear?(): void
  destroy?(): void | Promise<void>
}

export interface BatchOptions {
  continueOnError?: boolean
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  onProgress?: (completed: number, total: number, key: string) => void
}

export interface BatchFailure {
  key: string
  error: Error
  code?: CacheErrorCode
}

export interface BatchResult<T = unknown> {
  succeeded: string[]
  failed: BatchFailure[]
  results: Map<string, T>
  duration: number
  readonly allSucceeded: boolean
}

export interface BatchSetEntry<T = unknown> {
  key: string
  value: T
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
}

export type InvalidatePredicate<T = unknown> = (item: ReadonlyCacheItem<T>) => boolean

export interface CacheQueryOptions<T = unknown> {
  key: string
  fetcher: () => Promise<T>
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  staleTime?: number
  swr?: boolean
  dedupe?: boolean
  dedupeKey?: string
  force?: boolean
  retry?: number
  retryDelay?: number
}

export interface CacheQueryResult<T = unknown> {
  data: T
  fromCache: boolean
  stale: boolean
  updatedAt: number
}

export interface CacheQueryClientLike {
  fetch<T = unknown>(options: CacheQueryOptions<T>): Promise<CacheQueryResult<T>>
  prefetch<T = unknown>(options: CacheQueryOptions<T>): Promise<void>
  revalidate<T = unknown>(options: CacheQueryOptions<T>): Promise<CacheQueryResult<T>>
  clearInflight(key?: string): void
  getInflightKeys(): string[]
}
