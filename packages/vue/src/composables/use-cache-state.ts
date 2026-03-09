/**
 * Cache state composable.
 */

import type { Ref } from 'vue'
import { computed, getCurrentInstance, inject, onUnmounted, ref } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'
import { CacheEventType, CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../constants'

export interface UseCacheStateOptions {
  cache?: CacheManager<any>
  autoSync?: boolean
  syncInterval?: number
  autoCleanup?: boolean
}

export interface UseCacheStateReturn {
  size: Ref<number>
  keys: Ref<string[]>
  hitRate: Ref<number>
  isEmpty: Ref<boolean>
  isFull: Ref<boolean>
  refresh: () => void
}

function resolveCache<T>(explicit?: CacheManager<T>): { cache: CacheManager<T>, ownsCache: boolean } {
  if (explicit) {
    return { cache: explicit, ownsCache: false }
  }

  const canInject = !!getCurrentInstance()
  const injected = canInject ? inject<CacheManager<T> | null>(CACHE_INJECTION_KEY, null) : null

  if (injected) {
    return { cache: injected, ownsCache: false }
  }

  return { cache: new CoreCacheManager<T>(), ownsCache: true }
}

export function useCacheState<T = any>(cache: CacheManager<T>, options?: UseCacheStateOptions): UseCacheStateReturn
export function useCacheState<T = any>(options?: UseCacheStateOptions): UseCacheStateReturn
export function useCacheState<T = any>(
  cacheOrOptions: CacheManager<T> | UseCacheStateOptions = {},
  maybeOptions?: UseCacheStateOptions,
): UseCacheStateReturn {
  const options = (maybeOptions ?? cacheOrOptions) as UseCacheStateOptions
  const explicitCache = (maybeOptions ? cacheOrOptions as CacheManager<T> : options.cache as CacheManager<T> | undefined)

  const {
    autoSync = true,
    syncInterval = 1000,
    autoCleanup = false,
  } = options

  const { cache, ownsCache } = resolveCache(explicitCache)

  const size = ref(cache.size)
  const keys = ref(cache.keys())
  const stats = ref(cache.getStats())

  const hitRate = computed(() => stats.value.hitRate)
  const isEmpty = computed(() => size.value === 0)
  const isFull = computed(() => size.value >= stats.value.maxSize)

  const refresh = (): void => {
    size.value = cache.size
    keys.value = cache.keys()
    stats.value = cache.getStats()
  }

  const trackedEvents = [
    CacheEventType.SET,
    CacheEventType.DELETE,
    CacheEventType.CLEAR,
    CacheEventType.EVICT,
    CacheEventType.EXPIRE,
  ]

  if (autoSync) {
    trackedEvents.forEach(event => cache.on(event, refresh))
  }

  let timerId: ReturnType<typeof setInterval> | null = null
  if (autoSync && syncInterval > 0) {
    timerId = setInterval(refresh, syncInterval)
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (autoSync) {
        trackedEvents.forEach(event => cache.off(event, refresh))
      }

      if (timerId) {
        clearInterval(timerId)
      }

      if (ownsCache && autoCleanup) {
        cache.destroy()
      }
    })
  }

  return {
    size,
    keys,
    hitRate,
    isEmpty,
    isFull,
    refresh,
  }
}
