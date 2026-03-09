/**
 * Reactive cache composable.
 */

import type { Ref } from 'vue'
import { computed, getCurrentInstance, inject, onUnmounted, ref, shallowRef } from 'vue'
import type {
  BatchOptions,
  CacheManager,
  CacheOptions,
  CacheQueryClient,
  CacheStats,
  InvalidatePredicate,
  SetOptions,
} from '@ldesign/cache-core'
import { CacheEventType, CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../constants'

export interface UseCacheOptions<T = any> extends CacheOptions<T> {
  cache?: CacheManager<T>
  autoCleanup?: boolean
  reactiveStats?: boolean
}

export interface UseCacheReturn<T = any> {
  cache: CacheManager<T>
  source: Ref<'injected' | 'local'>
  query: CacheQueryClient
  get: (key: string) => T | undefined
  set: (key: string, value: T, options?: number | SetOptions) => void
  delete: (key: string) => boolean
  has: (key: string) => boolean
  clear: () => void
  size: Ref<number>
  keys: Ref<string[]>
  stats: Ref<CacheStats>
  mget: (keys: string[]) => Map<string, T>
  mset: (entries: Array<[string, T]>, options?: BatchOptions) => void
  mdel: (keys: string[], options?: BatchOptions) => void
  invalidateByTag: (tag: string) => number
  invalidateByNamespace: (namespace: string) => number
  invalidateWhere: (predicate: InvalidatePredicate<T>) => number
  cleanup: () => number
  on: CacheManager<T>['on']
  off: CacheManager<T>['off']
}

export function useCache<T = any>(options: UseCacheOptions<T> = {}): UseCacheReturn<T> {
  const {
    cache: explicitCache,
    autoCleanup = true,
    reactiveStats = true,
    ...cacheOptions
  } = options

  const instance = getCurrentInstance()
  const canInject = !!instance
  const injected = canInject ? inject<CacheManager<T> | null>(CACHE_INJECTION_KEY, null) : null

  const cache = explicitCache ?? injected ?? new CoreCacheManager<T>(cacheOptions)
  const source = ref<'injected' | 'local'>((explicitCache || injected) ? 'injected' : 'local')
  const ownsCache = !explicitCache && !injected

  const size = ref(cache.size)
  const keys = shallowRef<string[]>(cache.keys())
  const stats = ref<CacheStats>(cache.getStats())

  const updateReactiveState = () => {
    size.value = cache.size
    keys.value = cache.keys()
    if (reactiveStats) {
      stats.value = cache.getStats()
    }
  }

  const trackedEvents = [
    CacheEventType.SET,
    CacheEventType.DELETE,
    CacheEventType.CLEAR,
    CacheEventType.EVICT,
    CacheEventType.EXPIRE,
  ]

  if (reactiveStats) {
    trackedEvents.forEach(event => cache.on(event, updateReactiveState))
  }

  if (instance) {
    onUnmounted(() => {
      if (reactiveStats) {
        trackedEvents.forEach(event => cache.off(event, updateReactiveState))
      }

      if (autoCleanup && ownsCache) {
        cache.destroy()
      }
    })
  }

  const get = (key: string): T | undefined => {
    const value = cache.get(key)
    if (reactiveStats) {
      stats.value = cache.getStats()
    }
    return value
  }

  const set = (key: string, value: T, setOptions?: number | SetOptions): void => {
    cache.set(key, value, setOptions as any)
    updateReactiveState()
  }

  const deleteKey = (key: string): boolean => {
    const result = cache.delete(key)
    if (result) {
      updateReactiveState()
    }
    return result
  }

  const clear = (): void => {
    cache.clear()
    updateReactiveState()
  }

  const mset = (entries: Array<[string, T]>, batchOptions?: BatchOptions): void => {
    cache.mset(entries, batchOptions)
    updateReactiveState()
  }

  const mdel = (keysToDelete: string[], batchOptions?: BatchOptions): void => {
    cache.mdel(keysToDelete, batchOptions)
    updateReactiveState()
  }

  const invalidateByTag = (tag: string): number => {
    const removed = cache.invalidateByTag(tag)
    if (removed > 0) {
      updateReactiveState()
    }
    return removed
  }

  const invalidateByNamespace = (namespace: string): number => {
    const removed = cache.invalidateByNamespace(namespace)
    if (removed > 0) {
      updateReactiveState()
    }
    return removed
  }

  const invalidateWhere = (predicate: InvalidatePredicate<T>): number => {
    const removed = cache.invalidateWhere(predicate)
    if (removed > 0) {
      updateReactiveState()
    }
    return removed
  }

  return {
    cache,
    source: computed(() => source.value),
    query: cache.query,
    get,
    set,
    delete: deleteKey,
    has: cache.has.bind(cache),
    clear,
    size: computed(() => size.value),
    keys: computed(() => keys.value),
    stats: computed(() => stats.value),
    mget: cache.mget.bind(cache),
    mset,
    mdel,
    invalidateByTag,
    invalidateByNamespace,
    invalidateWhere,
    cleanup: cache.cleanup.bind(cache),
    on: cache.on.bind(cache),
    off: cache.off.bind(cache),
  }
}
