/**
 * v-cache directive.
 */

import type { CacheManager } from '@ldesign/cache-core'
import type { Directive, DirectiveBinding } from 'vue'

export interface VCacheBinding {
  key: string
  cache?: CacheManager
  fetcher?: () => Promise<any>
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  loading?: string
  error?: string
}

function resolveCache(binding: DirectiveBinding<VCacheBinding>): CacheManager | undefined {
  return binding.value.cache
    ?? (binding.instance as any)?.$cache
}

export const vCache: Directive<HTMLElement, VCacheBinding> = {
  async mounted(el, binding) {
    const cache = resolveCache(binding)
    const {
      key,
      fetcher,
      ttl,
      tags,
      namespace,
      priority,
      loading = '加载中...',
      error: errorText = '加载失败',
    } = binding.value

    if (!key || !cache) {
      console.warn('[v-cache] missing key/cache')
      return
    }

    const cached = cache.get(key)
    if (cached !== undefined) {
      el.textContent = String(cached)
      return
    }

    if (!fetcher) {
      return
    }

    el.textContent = loading

    try {
      const data = await fetcher()
      cache.set(key, data, { ttl, tags, namespace, priority })
      el.textContent = String(data)
    }
    catch (error) {
      console.error('[v-cache] fetch failed:', error)
      el.textContent = errorText
    }
  },

  updated(el, binding) {
    const cache = resolveCache(binding)
    const { key } = binding.value

    if (!key || !cache) {
      return
    }

    const cached = cache.get(key)
    if (cached !== undefined && el.textContent !== String(cached)) {
      el.textContent = String(cached)
    }
  },
}

export function createVCacheDirective(): Directive<HTMLElement, VCacheBinding> {
  return vCache
}
