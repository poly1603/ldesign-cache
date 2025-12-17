/**
 * CacheProvider 组件
 * 
 * 提供缓存上下文给子组�?
 * 
 * @module @ldesign/cache/vue/components/CacheProvider
 */

import { defineComponent, provide, type PropType, type Slot } from 'vue'
import type { CacheOptions } from '@ldesign/cache-core'
import { CacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../plugin'

/**
 * CacheProvider 组件
 * 
 * 提供缓存上下文给子组件使�?
 */
export const CacheProvider = defineComponent({
  name: 'CacheProvider',

  props: {
    /** 缓存选项 */
    options: {
      type: Object as PropType<CacheOptions>,
      default: () => ({}),
    },
    /** 缓存管理器实例（可选，如果不提供则创建新实例） */
    cache: {
      type: Object as PropType<CacheManager>,
      default: undefined,
    },
  },

  setup(props, { slots, expose }) {
    // 创建或使用提供的缓存实例
    const cacheInstance = props.cache ?? new CacheManager(props.options)

    // 提供给子组件
    provide(CACHE_INJECTION_KEY, cacheInstance)

    // 暴露缓存实例
    expose({
      cache: cacheInstance,
    })

    return () => {
      const defaultSlot = slots.default as Slot | undefined
      return defaultSlot ? defaultSlot({ cache: cacheInstance }) : null
    }
  },
})

export default CacheProvider
