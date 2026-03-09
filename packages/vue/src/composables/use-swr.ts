/**
 * SWR composable backed by cache core query client.
 */

import type { Ref } from 'vue'
import { getCurrentInstance, inject, onUnmounted, ref } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'
import { CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../constants'

export interface UseSWROptions<T> {
  cache?: CacheManager<any>
  key: string
  fetcher: () => Promise<T>
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  staleTime?: number
  revalidateInterval?: number
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  immediate?: boolean
  errorRetryCount?: number
  errorRetryInterval?: number
}

export interface UseSWRReturn<T> {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | null>
  isValidating: Ref<boolean>
  isFromCache: Ref<boolean>
  isStale: Ref<boolean>
  mutate: (newData?: T) => Promise<void>
  revalidate: () => Promise<void>
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

export function useSWR<T = any>(
  cacheOrOptions: CacheManager<T> | UseSWROptions<T>,
  maybeOptions?: UseSWROptions<T>,
): UseSWRReturn<T> {
  const options = (maybeOptions ?? cacheOrOptions) as UseSWROptions<T>
  const explicitCache = (maybeOptions ? cacheOrOptions as CacheManager<T> : options.cache as CacheManager<T> | undefined)

  const {
    key,
    fetcher,
    ttl,
    tags,
    namespace,
    priority,
    staleTime = 0,
    revalidateInterval = 0,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    immediate = true,
    errorRetryCount = 0,
    errorRetryInterval = 300,
  } = options

  const { cache, ownsCache } = resolveCache(explicitCache)

  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isValidating = ref(false)
  const isFromCache = ref(false)
  const isStale = ref(false)

  const execute = async (force = false): Promise<void> => {
    loading.value = data.value === undefined
    isValidating.value = true
    error.value = null

    try {
      const result = force
        ? await cache.query.revalidate<T>({
            key,
            fetcher,
            ttl,
            tags,
            namespace,
            priority,
            staleTime,
            retry: errorRetryCount,
            retryDelay: errorRetryInterval,
          })
        : await cache.query.fetch<T>({
            key,
            fetcher,
            ttl,
            tags,
            namespace,
            priority,
            staleTime,
            swr: true,
            retry: errorRetryCount,
            retryDelay: errorRetryInterval,
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

  const revalidate = async (): Promise<void> => {
    await execute(true)
  }

  const mutate = async (newData?: T): Promise<void> => {
    if (newData !== undefined) {
      cache.set(key, newData, { ttl, tags, namespace, priority })
      data.value = newData
      isFromCache.value = true
      isStale.value = false
      return
    }

    await revalidate()
  }

  const clearCache = (): void => {
    cache.delete(key)
    data.value = undefined
    isFromCache.value = false
    isStale.value = false
  }

  let intervalTimer: ReturnType<typeof setInterval> | null = null

  if (revalidateInterval > 0) {
    intervalTimer = setInterval(() => {
      void revalidate()
    }, revalidateInterval)
  }

  let removeFocusListener: (() => void) | null = null
  if (revalidateOnFocus && typeof window !== 'undefined') {
    const onFocus = () => {
      void revalidate()
    }
    window.addEventListener('focus', onFocus)
    removeFocusListener = () => window.removeEventListener('focus', onFocus)
  }

  let removeOnlineListener: (() => void) | null = null
  if (revalidateOnReconnect && typeof window !== 'undefined') {
    const onOnline = () => {
      void revalidate()
    }
    window.addEventListener('online', onOnline)
    removeOnlineListener = () => window.removeEventListener('online', onOnline)
  }

  if (immediate) {
    void execute(false)
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (intervalTimer) {
        clearInterval(intervalTimer)
      }

      removeFocusListener?.()
      removeOnlineListener?.()

      if (ownsCache) {
        cache.destroy()
      }
    })
  }

  return {
    data,
    loading,
    error,
    isValidating,
    isFromCache,
    isStale,
    mutate,
    revalidate,
    clearCache,
  }
}
