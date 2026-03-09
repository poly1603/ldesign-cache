/**
 * CacheProvider component.
 */

import type { CacheManager, CacheOptions } from '@ldesign/cache-core'
import { defineComponent, onUnmounted, provide, type PropType, type Slot } from 'vue'
import { CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CACHE_INJECTION_KEY } from '../constants'

export const CacheProvider = defineComponent({
  name: 'CacheProvider',

  props: {
    options: {
      type: Object as PropType<CacheOptions>,
      default: () => ({}),
    },
    cache: {
      type: Object as PropType<CacheManager>,
      default: undefined,
    },
  },

  setup(props, { slots, expose }) {
    const ownsCache = !props.cache
    const cacheInstance = props.cache ?? new CoreCacheManager(props.options)

    provide(CACHE_INJECTION_KEY, cacheInstance)

    if (ownsCache) {
      onUnmounted(() => {
        cacheInstance.destroy()
      })
    }

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
