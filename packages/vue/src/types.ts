/**
 * Vue 集成类型定义
 *
 * @module types
 */
import type { CacheManager, CacheOptions } from '@ldesign/cache-core'

/**
 * useCache 配置选项
 *
 * @example
 * ```typescript
 * const options: UseCacheOptions = {
 *   immediate: true,
 *   refreshInterval: 5000
 * }
 * ```
 */
export interface UseCacheOptions extends CacheOptions {
  /**
   * 是否立即加载缓存数据
   * @default true
   */
  immediate?: boolean

  /**
   * 自动刷新间隔（毫秒）
   * 设置后会定期刷新缓存数据
   */
  refreshInterval?: number
}

/**
 * CacheProvider 组件属性
 *
 * @example
 * ```vue
 * <CacheProvider :options="{ defaultTTL: 60000 }">
 *   <App />
 * </CacheProvider>
 * ```
 */
export interface CacheProviderProps {
  /**
   * 缓存管理器实例
   * 如果提供，将使用此实例而不是创建新实例
   */
  cache?: CacheManager

  /**
   * 缓存配置选项
   * 仅在未提供 cache 实例时使用
   */
  options?: CacheOptions
}
