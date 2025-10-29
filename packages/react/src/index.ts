/**
 * @ldesign/cache-react - React 集成
 *
 * 提供 React Hooks 和 Context Provider
 *
 * @author LDesign Team
 * @version 0.2.0
 */

// ============================================================================
// Hooks
// ============================================================================
export { useCache, useCacheKey, useCacheKeys } from './use-cache'
export { useCacheStats } from './use-cache-stats'
export * from './use-cache-helpers'

// ============================================================================
// Provider 组件
// ============================================================================
export { CacheProvider, useCacheContext } from './cache-provider'

// ============================================================================
// 类型导出
// ============================================================================
export type {
  UseCacheOptions,
  UseCacheReturn,
  CacheProviderProps,
} from './types'


