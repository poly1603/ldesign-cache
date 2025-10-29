/**
 * @ldesign/cache-solid - Solid.js 集成
 *
 * 提供 Solid.js 响应式集成
 *
 * @author LDesign Team
 * @version 0.2.0
 */

// ============================================================================
// Hooks/Stores
// ============================================================================
export { createCache, createCacheKey, createCacheKeys } from './create-cache'
export { createCacheStats } from './create-cache-stats'

// ============================================================================
// Provider
// ============================================================================
export { CacheProvider, useCacheContext } from './cache-provider'

// ============================================================================
// 类型导出
// ============================================================================
export type {
  CreateCacheOptions,
  CreateCacheReturn,
  CacheProviderProps,
} from './types'

