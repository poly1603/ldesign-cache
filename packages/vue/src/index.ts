/**
 * @ldesign/cache-vue - Vue 3 集成
 *
 * 提供响应式缓存管理、Composition API 和 Provider 组件
 *
 * @author LDesign Team
 * @version 0.2.0
 */

// ============================================================================
// 核心 Composables
// ============================================================================
export { useCache, useCacheKey, useCacheKeys } from './use-cache'
export { useCacheStats } from './use-cache-stats'
export * from './use-cache-helpers'

// ============================================================================
// Provider 组件
// ============================================================================
export { CacheProvider, useCacheProvider } from './cache-provider'

// ============================================================================
// 类型导出
// ============================================================================
export type {
  UseCacheOptions,
  UseCacheReturn,
  CacheProviderProps,
} from './types'


