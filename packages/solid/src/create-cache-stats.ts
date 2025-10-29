/**
 * Cache Stats Store
 */
import { createSignal, createEffect } from 'solid-js'
import { createCache } from '@ldesign/cache-core'
import type { CacheStats } from '@ldesign/cache-core'

const globalCache = createCache()

export function createCacheStats() {
  const [stats, setStats] = createSignal<CacheStats | null>(null)
  const [loading, setLoading] = createSignal(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await globalCache.getStats()
      setStats(data)
    } finally {
      setLoading(false)
    }
  }

  createEffect(() => {
    refresh()
  })

  return {
    stats,
    loading,
    refresh,
  }
}

