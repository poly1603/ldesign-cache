/**
 * Svelte 集成类型定义
 */
import type { CacheManager, CacheOptions, SetOptions } from '@ldesign/cache-core'

/**
 * Cache Store 选项
 */
export interface CacheStoreOptions<T = any> extends SetOptions {
  immediate?: boolean
  initialValue?: T
  fetcher?: () => Promise<T> | T
}

/**
 * Cache Store 值
 */
export interface CacheStoreValue<T = any> {
  data: T | null
  loading: boolean
  error: Error | null
  exists: boolean
}

