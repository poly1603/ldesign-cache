/**
 * Svelte Cache Stores
 */
import { writable, derived } from 'svelte/store'
import { createCache } from '@ldesign/cache-core'
import type { CacheStoreOptions, CacheStoreValue } from './types'
import type { SetOptions } from '@ldesign/cache-core'

const globalCache = createCache()

export function cacheStore<T = any>(key: string, options: CacheStoreOptions<T> = {}) {
  const store = writable<CacheStoreValue<T>>({
    data: options.initialValue ?? null,
    loading: false,
    error: null,
    exists: false,
  })

  const refresh = async () => {
    store.update(state => ({ ...state, loading: true, error: null }))

    try {
      let value: T

      if (options.fetcher) {
        value = await options.fetcher()
        await globalCache.set(key, value, options)
      } else {
        const cached = await globalCache.get<T>(key)
        value = cached as T
      }

      store.update(state => ({
        ...state,
        data: value,
        loading: false,
        exists: value !== null,
      }))
    } catch (error) {
      store.update(state => ({
        ...state,
        error: error as Error,
        loading: false,
      }))
    }
  }

  const update = async (value: T, updateOptions?: SetOptions) => {
    await globalCache.set(key, value, updateOptions)
    store.update(state => ({
      ...state,
      data: value,
      exists: true,
    }))
  }

  const remove = async () => {
    await globalCache.remove(key)
    store.update(state => ({
      ...state,
      data: null,
      exists: false,
    }))
  }

  if (options.immediate !== false) {
    refresh()
  }

  return {
    subscribe: store.subscribe,
    refresh,
    update,
    remove,
  }
}

export function cacheKeyStore<T = any>(key: string) {
  return cacheStore<T>(key)
}

