/**
 * @ldesign/cache-core
 *
 * 框架无关的缓存管理核心库
 *
 * 提供高性能的缓存管理功能，支持多种存储引擎和智能策略
 *
 * @module @ldesign/cache-core
 * @version 0.2.0
 * @author ldesign
 * @license MIT
 *
 * @example
 * ```typescript
 * import { createCache, cache } from '@ldesign/cache-core'
 *
 * // 创建缓存实例
 * const myCache = createCache({
 *   defaultEngine: 'memory',
 *   defaultTTL: 60 * 1000
 * })
 *
 * // 使用便捷 API
 * await cache.set('user', { name: '张三' })
 * const user = await cache.get('user')
 * ```
 */

// ==================== 类型导出 ====================

/**
 * 性能相关常量
 */
export * from './constants'

// ==================== 常量导出 ====================

/**
 * 缓存管理器类
 * @see {@link CacheManager}
 */
export { CacheManager } from './core/cache-manager'

// ==================== 工具函数导出 ====================

/**
 * 存储引擎
 */
export * from './engines'

// ==================== 策略导出 ====================

/**
 * 工厂函数和便捷 API
 * @see {@link createCache}
 * @see {@link getDefaultCache}
 * @see {@link cache}
 */
export { cache, createCache, getDefaultCache } from './factory'

// ==================== 存储引擎导出 ====================

/**
 * 预设配置函数
 * @see {@link getPresetOptions}
 */
export { getPresetOptions } from './presets'

// ==================== 核心管理器 ====================

/**
 * 淘汰策略
 */
export * from './strategies'

/**
 * 所有类型定义
 */
export * from './types'

// ==================== 预设配置 ====================

/**
 * 工具函数
 */
export * from './utils'

// ==================== 版本信息 ====================

/**
 * 当前版本号
 */
export const version = '0.2.0'
