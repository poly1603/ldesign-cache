/**
 * Query composable backed by cache core query client.
 */

import type { Ref } from 'vue'
import { getCurrentInstance, inject, onUnmounted, ref } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'
import { CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../constants'

export interface UseCacheQueryOptions<T> {
  cache?: CacheManager<any>
  key: string
  queryFn: () => Promise<T>
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  immediate?: boolean
  enabled?: boolean
  retryCount?: number
  retryDelay?: number
  staleTime?: number
  swr?: boolean
  dedupe?: boolean
}

export interface UseCacheQueryReturn<T> {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | null>
  isFromCache: Ref<boolean>
  isStale: Ref<boolean>
  isValidating: Ref<boolean>
  execute: () => Promise<void>
  refetch: () => Promise<void>
  clearCache: () => void
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

export function useCacheQuery<T = any>(
  cacheOrOptions: CacheManager<T> | UseCacheQueryOptions<T>,
  maybeOptions?: UseCacheQueryOptions<T>,
): UseCacheQueryReturn<T> {
  const options = (maybeOptions ?? cacheOrOptions) as UseCacheQueryOptions<T>
  const explicitCache = (maybeOptions ? cacheOrOptions as CacheManager<T> : options.cache as CacheManager<T> | undefined)

  const {
    key,
    queryFn,
    ttl,
    tags,
    namespace,
    priority,
    immediate = true,
    enabled = true,
    retryCount = 0,
    retryDelay = 300,
    staleTime = 0,
    swr = false,
    dedupe = true,
  } = options

  const { cache, ownsCache } = resolveCache(explicitCache)

  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isFromCache = ref(false)
  const isStale = ref(false)
  const isValidating = ref(false)

  const execute = async (): Promise<void> => {
    if (!enabled) {
      return
    }

    loading.value = data.value === undefined
    isValidating.value = true
    error.value = null

    try {
      const result = await cache.query.fetch<T>({
        key,
        fetcher: queryFn,
        ttl,
        tags,
        namespace,
        priority,
        staleTime,
        swr,
        dedupe,
        retry: retryCount,
        retryDelay,
      })

      data.value = result.data
      isFromCache.value = result.fromCache
      isStale.value = result.stale
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
      isValidating.value = false
    }
  }

  const refetch = async (): Promise<void> => {
    loading.value = true
    isValidating.value = true
    error.value = null

    try {
      const result = await cache.query.revalidate<T>({
        key,
        fetcher: queryFn,
        ttl,
        tags,
        namespace,
        priority,
        staleTime,
        dedupe,
        retry: retryCount,
        retryDelay,
      })

      data.value = result.data
      isFromCache.value = result.fromCache
      isStale.value = result.stale
    }
    catch (err) {
      error.value = err as Error
    }
    finally {
      loading.value = false
      isValidating.value = false
    }
  }

  const clearCache = (): void => {
    cache.delete(key)
    data.value = undefined
    isFromCache.value = false
    isStale.value = false
  }

  if (immediate) {
    void execute()
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (ownsCache) {
        cache.destroy()
      }
    })
  }

  return {
    data,
    loading,
    error,
    isFromCache,
    isStale,
    isValidating,
    execute,
    refetch,
    clearCache,
  }
}
