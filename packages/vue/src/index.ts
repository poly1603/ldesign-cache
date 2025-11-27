/**
 * @ldesign/cache-vue - Vue 3 缓存集成
 *
 * 提供响应式缓存管理、Composition API、Provider 组件和 Vue 插件
 *
 * @module @ldesign/cache-vue
 * @version 0.2.0
 * @author ldesign
 * @license MIT
 *
 * @example
 * ```typescript
 * // 方式一：使用 Vue 插件（推荐）
 * import { createApp } from 'vue'
 * import { cachePlugin } from '@ldesign/cache-vue'
 *
 * const app = createApp(App)
 * app.use(cachePlugin, { defaultTTL: 5 * 60 * 1000 })
 * app.mount('#app')
 *
 * // 方式二：使用组合式函数
 * import { useCache } from '@ldesign/cache-vue'
 *
 * const { set, get, useReactiveCache } = useCache()
 * const userCache = useReactiveCache<User>('user')
 * ```
 */

// ==================== Vue 插件 ====================

/**
 * 缓存 Provider 组件和注入函数
 * @see {@link CacheProvider}
 * @see {@link useCacheProvider}
 */
export { CACHE_MANAGER_KEY, CacheProvider, useCacheProvider } from './cache-provider'
/**
 * Vue 缓存插件
 * @see {@link cachePlugin}
 * @see {@link createCachePlugin}
 */
export { cachePlugin, createCachePlugin } from './plugin'

// ==================== 核心 Composables ====================

export type { CachePluginOptions } from './plugin'

/**
 * 所有类型定义
 */
export type {
  CacheProviderProps,
  UseCacheOptions,
} from './types'
/**
 * 缓存组合式函数
 * @see {@link useCache}
 * @see {@link useCacheKey}
 * @see {@link useCacheKeys}
 */
export { useCache, useCacheKey, useCacheKeys } from './use-cache'

export type { ReactiveCache, UseCacheReturn } from './use-cache'
/**
 * 缓存辅助组合式函数
 * @see {@link useCacheValue}
 * @see {@link useCacheSync}
 */
export { useCacheSync, useCacheValue } from './use-cache-helpers'

export type { UseCacheSyncReturn, UseCacheValueReturn } from './use-cache-helpers'
/**
 * 缓存统计组合式函数
 * @see {@link useCacheStats}
 */
export { useCacheStats } from './use-cache-stats'

// ==================== 类型导出 ====================

export type { UseCacheStatsReturn } from './use-cache-stats'

// ==================== 版本信息 ====================

/**
 * 当前版本号
 */
export const version = '0.2.0'
