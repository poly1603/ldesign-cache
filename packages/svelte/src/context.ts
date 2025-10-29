/**
 * Svelte Context for Cache
 */
import { getContext, setContext } from 'svelte'
import { createCache, type CacheManager } from '@ldesign/cache-core'

const CACHE_CONTEXT_KEY = Symbol('cache')

export function setCacheContext(cache: CacheManager) {
  setContext(CACHE_CONTEXT_KEY, cache)
}

export function getCacheContext(): CacheManager {
  const cache = getContext<CacheManager>(CACHE_CONTEXT_KEY)
  if (!cache) {
    return createCache()
  }
  return cache
}

