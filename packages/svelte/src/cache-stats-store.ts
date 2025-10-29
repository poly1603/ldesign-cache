/**
 * Cache Stats Store
 */
import { writable } from 'svelte/store'
import { createCache } from '@ldesign/cache-core'
import type { CacheStats } from '@ldesign/cache-core'

const globalCache = createCache()

export function cacheStatsStore() {
  const store = writable<{ stats: CacheStats | null; loading: boolean }>({
    stats: null,
    loading: false,
  })

  const refresh = async () => {
    store.update(state => ({ ...state, loading: true }))
    try {
      const stats = await globalCache.getStats()
      store.update(() => ({ stats, loading: false }))
    } catch {
      store.update(state => ({ ...state, loading: false }))
    }
  }

  refresh()

  return {
    subscribe: store.subscribe,
    refresh,
  }
}

