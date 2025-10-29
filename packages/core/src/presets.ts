/**
 * 预设配置
 */
import type { CacheOptions } from './types'

/**
 * 浏览器环境预设
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
 * Node.js 环境预设
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
 * 离线应用预设
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
 * SSR 环境预设
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
 * 获取预设选项
 */
export function getPresetOptions(preset: 'browser' | 'node' | 'offline' | 'ssr'): CacheOptions {
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

