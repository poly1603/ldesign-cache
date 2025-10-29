/**
 * Cache 工厂函数
 */
import type { CacheOptions, SerializableValue } from './types'
import { CacheManager } from './core/cache-manager'
import { getPresetOptions } from './presets'

/**
 * 支持的环境预设类型
 */
type DetectedPreset = 'browser' | 'ssr' | 'node' | 'offline'

/**
 * 自动检测当前运行环境
 */
function detectPreset(): DetectedPreset {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser'
  }
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).process !== 'undefined') {
    return 'node'
  }
  return 'ssr'
}

/**
 * 创建缓存管理器实例
 */
export function createCache(options?: CacheOptions & { preset?: DetectedPreset }): CacheManager {
  const preset = options?.preset ?? detectPreset()
  const { preset: _preset, ...rest } = options || {}
  const merged = { ...getPresetOptions(preset), ...rest } as CacheOptions
  return new CacheManager(merged)
}

/**
 * 获取默认缓存管理器实例（懒初始化单例）
 */
let _defaultCache: CacheManager | null = null
export function getDefaultCache(options?: CacheOptions & { preset?: DetectedPreset }): CacheManager {
  if (!_defaultCache) {
    _defaultCache = createCache(options)
  }
  return _defaultCache
}

/**
 * 全局缓存实例的便捷 API
 */
export const cache = {
  async get<T extends SerializableValue = SerializableValue>(key: string) {
    return getDefaultCache().get<T>(key)
  },

  async set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: import('./types').SetOptions,
  ) {
    return getDefaultCache().set<T>(key, value, options)
  },

  async remove(key: string) {
    return getDefaultCache().remove(key)
  },

  async clear(engine?: import('./types').StorageEngine) {
    return getDefaultCache().clear(engine)
  },

  async has(key: string) {
    return getDefaultCache().has(key)
  },

  async keys(engine?: import('./types').StorageEngine) {
    return getDefaultCache().keys(engine)
  },

  async getStats() {
    return getDefaultCache().getStats()
  },

  async remember<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: import('./types').SetOptions & { refresh?: boolean },
  ) {
    return getDefaultCache().remember<T>(key, fetcher, options)
  },

  manager(): CacheManager {
    return getDefaultCache()
  },
} as const

