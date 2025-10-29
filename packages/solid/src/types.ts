/**
 * Solid 集成类型定义
 */
import type { Accessor } from 'solid-js'
import type { CacheManager, CacheOptions, SetOptions } from '@ldesign/cache-core'

/**
 * createCache 选项
 */
export interface CreateCacheOptions<T = any> extends SetOptions {
  immediate?: boolean
  initialValue?: T
  fetcher?: () => Promise<T> | T
}

/**
 * createCache 返回值
 */
export interface CreateCacheReturn<T = any> {
  data: Accessor<T | null>
  loading: Accessor<boolean>
  error: Accessor<Error | null>
  exists: Accessor<boolean>
  refresh: () => Promise<void>
  update: (value: T, options?: SetOptions) => Promise<void>
  remove: () => Promise<void>
}

/**
 * CacheProvider 组件属性
 */
export interface CacheProviderProps {
  cache?: CacheManager
  options?: CacheOptions
  children?: any
}

