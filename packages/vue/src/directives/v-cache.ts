/**
 * v-cache 指令
 * 
 * 用于在模板中直接使用缓存
 * 
 * @module @ldesign/cache/vue/directives/v-cache
 */

import type { Directive, DirectiveBinding } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'

/**
 * v-cache 指令绑定�?
 */
export interface VCacheBinding {
  /** 缓存�?*/
  key: string
  /** 缓存管理器实�?*/
  cache: CacheManager
  /** 数据获取函数 */
  fetcher?: () => Promise<any>
  /** 缓存 TTL（毫秒） */
  ttl?: number
  /** 加载时显示的内容 */
  loading?: string
  /** 错误时显示的内容 */
  error?: string
}

/**
 * v-cache 指令实现
 * 
 * @example
 * ```vue
 * <template>
 *   <!-- 基础用法 -->
 *   <div v-cache="{ key: 'user:1', cache, fetcher: fetchUser }">
 *     {{ user }}
 *   </div>
 * 
 *   <!-- 带加载和错误状�?-->
 *   <div v-cache="{
 *     key: 'posts',
 *     cache,
 *     fetcher: fetchPosts,
 *     loading: '加载�?..',
 *     error: '加载失败'
 *   }">
 *     {{ posts }}
 *   </div>
 * </template>
 * ```
 */
export const vCache: Directive<HTMLElement, VCacheBinding> = {
  async mounted(el: HTMLElement, binding: DirectiveBinding<VCacheBinding>) {
    const { key, cache, fetcher, ttl, loading = '加载�?..', error: errorText = '加载失败' } = binding.value

    if (!key || !cache) {
      console.warn('[v-cache] 缺少必需�?key �?cache 参数')
      return
    }

    // 先尝试从缓存获取
    const cached = cache.get(key)
    if (cached !== undefined) {
      el.textContent = String(cached)
      return
    }

    // 如果没有 fetcher，则不执行任何操�?
    if (!fetcher) {
      return
    }

    // 显示加载状�?
    const originalContent = el.textContent
    el.textContent = loading

    try {
      // 获取数据
      const data = await fetcher()
      
      // 缓存数据
      cache.set(key, data, ttl)
      
      // 更新内容
      el.textContent = String(data)
    }
    catch (err) {
      console.error('[v-cache] 数据获取失败:', err)
      el.textContent = errorText
    }
  },

  async updated(el: HTMLElement, binding: DirectiveBinding<VCacheBinding>) {
    const { key, cache } = binding.value

    if (!key || !cache) {
      return
    }

    // 检查缓存是否有更新
    const cached = cache.get(key)
    if (cached !== undefined && el.textContent !== String(cached)) {
      el.textContent = String(cached)
    }
  },
}

/**
 * 创建 v-cache 指令
 * @returns v-cache 指令
 */
export function createVCacheDirective(): Directive<HTMLElement, VCacheBinding> {
  return vCache
}

