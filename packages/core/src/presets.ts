/**
 * 缓存预设配置
 *
 * 提供针对不同运行环境优化的预设配置
 *
 * @module presets
 */
import type { CacheOptions } from './types'

/**
 * 预设类型
 */
export type PresetType = 'browser' | 'node' | 'offline' | 'ssr'

/**
 * 创建浏览器环境预设配置
 *
 * 适用于标准浏览器应用，使用 localStorage 作为默认存储
 *
 * @param options - 自定义配置选项
 * @returns 合并后的缓存配置
 *
 * @example
 * ```typescript
 * const options = createBrowserCache({
 *   defaultTTL: 30 * 60 * 1000 // 覆盖为 30 分钟
 * })
 * ```
 */
export function createBrowserCache(options?: Partial<CacheOptions>): CacheOptions {
  return {
    defaultEngine: 'localStorage',
    defaultTTL: 60 * 60 * 1000, // 1小时
    enablePerformanceTracking: true,
    ...options,
  }
}

/**
 * 创建 Node.js 环境预设配置
 *
 * 适用于 Node.js 服务端应用，使用内存存储
 *
 * @param options - 自定义配置选项
 * @returns 合并后的缓存配置
 *
 * @example
 * ```typescript
 * const options = createNodeCache({
 *   defaultTTL: 60 * 60 * 1000 // 覆盖为 1 小时
 * })
 * ```
 */
export function createNodeCache(options?: Partial<CacheOptions>): CacheOptions {
  return {
    defaultEngine: 'memory',
    defaultTTL: 30 * 60 * 1000, // 30分钟
    enablePerformanceTracking: false,
    ...options,
  }
}

/**
 * 创建离线应用预设配置
 *
 * 适用于 PWA 等离线优先应用，使用 IndexedDB 作为默认存储
 *
 * @param options - 自定义配置选项
 * @returns 合并后的缓存配置
 *
 * @example
 * ```typescript
 * const options = createOfflineCache({
 *   defaultTTL: 7 * 24 * 60 * 60 * 1000 // 覆盖为 7 天
 * })
 * ```
 */
export function createOfflineCache(options?: Partial<CacheOptions>): CacheOptions {
  return {
    defaultEngine: 'indexedDB',
    defaultTTL: 24 * 60 * 60 * 1000, // 24小时
    enablePerformanceTracking: true,
    ...options,
  }
}

/**
 * 创建 SSR 环境预设配置
 *
 * 适用于服务端渲染应用，使用内存存储，较短的 TTL
 *
 * @param options - 自定义配置选项
 * @returns 合并后的缓存配置
 *
 * @example
 * ```typescript
 * const options = createSSRCache({
 *   defaultTTL: 5 * 60 * 1000 // 覆盖为 5 分钟
 * })
 * ```
 */
export function createSSRCache(options?: Partial<CacheOptions>): CacheOptions {
  return {
    defaultEngine: 'memory',
    defaultTTL: 10 * 60 * 1000, // 10分钟
    enablePerformanceTracking: false,
    ...options,
  }
}

/**
 * 根据预设类型获取配置选项
 *
 * @param preset - 预设类型
 * @returns 对应的缓存配置
 *
 * @example
 * ```typescript
 * const browserOptions = getPresetOptions('browser')
 * const nodeOptions = getPresetOptions('node')
 * ```
 */
export function getPresetOptions(preset: PresetType): CacheOptions {
  switch (preset) {
    case 'browser':
      return createBrowserCache()
    case 'node':
      return createNodeCache()
    case 'offline':
      return createOfflineCache()
    case 'ssr':
      return createSSRCache()
    default:
      return createBrowserCache()
  }
}
