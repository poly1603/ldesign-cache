/**
 * @ldesign/cache-svelte - Svelte 集成
 *
 * 提供 Svelte stores 集成
 *
 * @author LDesign Team
 * @version 0.2.0
 */

// ============================================================================
// Stores
// ============================================================================
export { cacheStore, cacheKeyStore } from './stores'
export { cacheStatsStore } from './cache-stats-store'

// ============================================================================
// Context
// ============================================================================
export { setCacheContext, getCacheContext } from './context'

// ============================================================================
// 类型导出
// ============================================================================
export type {
  CacheStoreOptions,
  CacheStoreValue,
} from './types'

