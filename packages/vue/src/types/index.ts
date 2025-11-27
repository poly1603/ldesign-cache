/**
 * Vue 适配器类型定义
 * @module @ldesign/cache/vue/types
 */

import type { InjectionKey } from 'vue'
import type { CacheManager } from '@ldesign/cache/core'

/**
 * 缓存注入键类型
 */
export const CACHE_INJECTION_KEY: InjectionKey<CacheManager> = Symbol('cache')

/**
 * 导出所有 composables 的类型
 */
export type { UseCacheOptions, UseCacheReturn } from '../composables/use-cache'
export type { UseCacheStateOptions, UseCacheStateReturn } from '../composables/use-cache-state'
export type { UseCacheQueryOptions, UseCacheQueryReturn } from '../composables/use-cache-query'
export type { UseSWROptions, UseSWRReturn } from '../composables/use-swr'

/**
 * 导出指令类型
 */
export type { VCacheBinding } from '../directives/v-cache'

/**
 * 导出装饰器类型
 */
export type { CacheableOptions } from '../decorators/cacheable'

