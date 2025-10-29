/**
 * Solid Cache Hooks
 */
import { createSignal, createEffect, onCleanup } from 'solid-js'
import { createCache as createCoreCache } from '@ldesign/cache-core'
import type { CreateCacheOptions, CreateCacheReturn } from './types'
import type { SetOptions } from '@ldesign/cache-core'

const globalCache = createCoreCache()

export function createCache<T = any>(
  key: string,
  options: CreateCacheOptions<T> = {},
): CreateCacheReturn<T> {
  const [data, setData] = createSignal<T | null>(options.initialValue ?? null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<Error | null>(null)
  const [exists, setExists] = createSignal(false)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)

      if (options.fetcher) {
        const value = await options.fetcher()
        await globalCache.set(key, value, options)
        setData(value as T)
        setExists(true)
      } else {
        const value = await globalCache.get<T>(key)
        setData(value)
        setExists(value !== null)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const update = async (value: T, updateOptions?: SetOptions) => {
    await globalCache.set(key, value, updateOptions)
    setData(value)
    setExists(true)
  }

  const remove = async () => {
    await globalCache.remove(key)
    setData(null)
    setExists(false)
  }

  if (options.immediate !== false) {
    createEffect(() => {
      refresh()
    })
  }

  return {
    data,
    loading,
    error,
    exists,
    refresh,
    update,
    remove,
  }
}

export function createCacheKey<T = any>(key: string) {
  return createCache<T>(key)
}

export function createCacheKeys(keys: string[]) {
  return keys.map(key => createCache(key))
}

