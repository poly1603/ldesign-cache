/**
 * Vue 閫傞厤鍣ㄧ被鍨嬪畾涔?
 * @module @ldesign/cache/vue/types
 */

import type { InjectionKey } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'

/**
 * 缂撳瓨娉ㄥ叆閿被鍨?
 */
export const CACHE_INJECTION_KEY: InjectionKey<CacheManager> = Symbol('cache')

/**
 * 瀵煎嚭鎵�鏈?composables 鐨勭被鍨?
 */
export type { UseCacheOptions, UseCacheReturn } from '../composables/use-cache'
export type { UseCacheStateOptions, UseCacheStateReturn } from '../composables/use-cache-state'
export type { UseCacheQueryOptions, UseCacheQueryReturn } from '../composables/use-cache-query'
export type { UseSWROptions, UseSWRReturn } from '../composables/use-swr'

/**
 * 瀵煎嚭鎸囦护绫诲瀷
 */
export type { VCacheBinding } from '../directives/v-cache'

/**
 * 瀵煎嚭瑁呴グ鍣ㄧ被鍨?
 */
export type { CacheableOptions } from '../decorators/cacheable'

