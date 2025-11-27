import type { CacheManager, CacheOptions } from '@ldesign/cache-core'
/**
 * 缓存 Provider 组件
 *
 * 提供缓存管理器的依赖注入功能
 *
 * @module cache-provider
 */
import type { InjectionKey, PropType } from 'vue'
import { createCache } from '@ldesign/cache-core'
import { defineComponent, inject, onUnmounted, provide } from 'vue'

/**
 * 缓存管理器注入键
 */
export const CACHE_MANAGER_KEY: InjectionKey<CacheManager> = Symbol('cache-manager')

/**
 * 缓存 Provider 组件
 *
 * 为子组件提供缓存管理器实例
 *
 * @example
 * ```vue
 * <template>
 *   <CacheProvider :options="{ defaultTTL: 60000 }">
 *     <ChildComponent />
 *   </CacheProvider>
 * </template>
 * ```
 */
export const CacheProvider = defineComponent({
  name: 'CacheProvider',

  props: {
    /**
     * 缓存管理器实例
     * 如果提供，将使用此实例而不是创建新实例
     */
    cache: {
      type: Object as PropType<CacheManager>,
      default: undefined,
    },

    /**
     * 缓存配置选项
     * 仅在未提供 cache 实例时使用
     */
    options: {
      type: Object as PropType<CacheOptions>,
      default: () => ({}),
    },
  },

  setup(props, { slots }) {
    // 使用提供的实例或创建新实例
    const cacheManager = props.cache ?? createCache(props.options)

    // 提供缓存管理器
    provide(CACHE_MANAGER_KEY, cacheManager)

    // 组件卸载时清理（仅在本地创建时）
    if (!props.cache) {
      onUnmounted(() => {
        cacheManager.destroy?.()
      })
    }

    return () => slots.default?.()
  },
})

/**
 * 获取注入的缓存管理器
 *
 * @returns 缓存管理器实例
 * @throws 如果未在 CacheProvider 内使用则抛出错误
 *
 * @example
 * ```typescript
 * const cache = useCacheProvider()
 * await cache.set('key', 'value')
 * ```
 */
export function useCacheProvider(): CacheManager {
  const cache = inject(CACHE_MANAGER_KEY)

  if (!cache) {
    throw new Error('useCacheProvider must be used within a CacheProvider')
  }

  return cache
}
