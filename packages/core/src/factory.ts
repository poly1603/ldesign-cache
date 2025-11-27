/**
 * 缓存工厂函数和便捷 API
 *
 * 提供创建缓存实例的工厂函数和全局便捷 API
 *
 * @module factory
 */
import type { CacheOptions, SerializableValue, SetOptions, StorageEngine } from './types'
import { CacheManager } from './core/cache-manager'
import { getPresetOptions } from './presets'

/**
 * 支持的环境预设类型
 */
export type DetectedPreset = 'browser' | 'ssr' | 'node' | 'offline'

/**
 * 自动检测当前运行环境
 *
 * @returns 检测到的环境类型
 * @internal
 */
function detectPreset(): DetectedPreset {
  // 浏览器环境
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser'
  }
  // Node.js 环境 - 检查 globalThis 上的 process 对象
  // eslint-disable-next-line node/prefer-global/process
  if (typeof globalThis !== 'undefined' && 'process' in globalThis && typeof (globalThis as any).process?.versions?.node === 'string') {
    return 'node'
  }
  // SSR 或其他服务端渲染环境
  return 'ssr'
}

/**
 * 创建缓存管理器实例
 *
 * 自动根据运行环境选择最适合的预设配置，也可以通过 preset 参数显式指定
 *
 * @param options - 缓存配置选项
 * @param options.preset - 显式指定环境预设，覆盖自动检测
 * @returns 缓存管理器实例
 *
 * @example
 * ```typescript
 * // 自动检测环境
 * const cache = createCache()
 *
 * // 显式指定浏览器环境
 * const browserCache = createCache({ preset: 'browser' })
 *
 * // 自定义配置
 * const customCache = createCache({
 *   defaultEngine: 'memory',
 *   defaultTTL: 24 * 60 * 60 * 1000 // 24小时
 * })
 * ```
 */
export function createCache(options?: CacheOptions & { preset?: DetectedPreset }): CacheManager {
  const preset = options?.preset ?? detectPreset()
  const { preset: _preset, ...rest } = options || {}
  const merged = { ...getPresetOptions(preset), ...rest } as CacheOptions
  return new CacheManager(merged)
}

/**
 * 默认缓存实例（懒初始化单例）
 */
let _defaultCache: CacheManager | null = null

/**
 * 获取默认缓存管理器实例（懒初始化单例）
 *
 * 避免在 SSR/Node 环境下提前触发浏览器 API 导致错误
 *
 * @param options - 缓存配置选项（仅在首次调用时生效）
 * @returns 默认缓存管理器实例
 *
 * @example
 * ```typescript
 * const cache = getDefaultCache()
 * await cache.set('key', 'value')
 * ```
 */
export function getDefaultCache(options?: CacheOptions & { preset?: DetectedPreset }): CacheManager {
  if (!_defaultCache) {
    _defaultCache = createCache(options)
  }
  return _defaultCache
}

/**
 * 全局缓存实例的便捷 API
 *
 * 提供简洁的缓存操作接口，内部使用懒初始化的默认缓存实例
 *
 * @example
 * ```typescript
 * import { cache } from '@ldesign/cache-core'
 *
 * // 设置缓存
 * await cache.set('user', { name: '张三', age: 25 })
 *
 * // 获取缓存
 * const user = await cache.get<User>('user')
 *
 * // 记忆函数模式
 * const userData = await cache.remember('user-data', async () => {
 *   return await fetchUserFromAPI()
 * }, { ttl: 5 * 60 * 1000 })
 * ```
 */
export const cache = {
  /**
   * 获取缓存值
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @returns 缓存值或 null
   */
  async get<T extends SerializableValue = SerializableValue>(key: string): Promise<T | null> {
    return getDefaultCache().get<T>(key)
  },

  /**
   * 设置缓存值
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @param value - 缓存值
   * @param options - 设置选项
   */
  async set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: SetOptions,
  ): Promise<void> {
    return getDefaultCache().set<T>(key, value, options)
  },

  /**
   * 删除指定键的缓存
   *
   * @param key - 缓存键
   */
  async remove(key: string): Promise<void> {
    return getDefaultCache().remove(key)
  },

  /**
   * 清空缓存
   *
   * @param engine - 可选，指定要清空的存储引擎
   */
  async clear(engine?: StorageEngine): Promise<void> {
    return getDefaultCache().clear(engine)
  },

  /**
   * 检查键是否存在
   *
   * @param key - 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    return getDefaultCache().has(key)
  },

  /**
   * 获取所有键名
   *
   * @param engine - 可选，指定存储引擎
   * @returns 键名数组
   */
  async keys(engine?: StorageEngine): Promise<string[]> {
    return getDefaultCache().keys(engine)
  },

  /**
   * 获取缓存统计信息
   *
   * @returns 统计信息
   */
  async getStats() {
    return getDefaultCache().getStats()
  },

  /**
   * 记忆函数：如果缓存不存在则执行 fetcher 并缓存结果
   *
   * @typeParam T - 缓存值类型
   * @param key - 缓存键
   * @param fetcher - 数据获取函数
   * @param options - 设置选项
   * @returns 缓存值
   */
  async remember<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: SetOptions & { refresh?: boolean },
  ): Promise<T> {
    return getDefaultCache().remember<T>(key, fetcher, options)
  },

  /**
   * 获取底层缓存管理器实例
   *
   * @returns 缓存管理器实例
   */
  manager(): CacheManager {
    return getDefaultCache()
  },
} as const
