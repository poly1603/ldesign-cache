/**
 * Vue 缓存 Composable
 * 
 * 提供响应式的缓存操作接口
 * 
 * @module @ldesign/cache/vue/use-cache
 */

import type { Ref } from 'vue'
import { computed, onUnmounted, ref, shallowRef } from 'vue'
import type { CacheEventType, CacheOptions, CacheStats } from '@ldesign/cache/core'
import { CacheManager } from '@ldesign/cache/core'

/**
 * useCache 选项
 */
export interface UseCacheOptions extends CacheOptions {
  /** 是否自动清理（组件卸载时） */
  autoCleanup?: boolean
  /** 是否启用响应式统计 */
  reactiveStats?: boolean
}

/**
 * useCache 返回值
 * @template T - 缓存值类型
 */
export interface UseCacheReturn<T = any> {
  /** 缓存管理器实例 */
  cache: CacheManager<T>
  /** 获取缓存项 */
  get: (key: string) => T | undefined
  /** 设置缓存项 */
  set: (key: string, value: T, ttl?: number) => void
  /** 删除缓存项 */
  delete: (key: string) => boolean
  /** 检查缓存项是否存在 */
  has: (key: string) => boolean
  /** 清空所有缓存 */
  clear: () => void
  /** 缓存大小（响应式） */
  size: Ref<number>
  /** 所有键（响应式） */
  keys: Ref<string[]>
  /** 统计信息（响应式） */
  stats: Ref<CacheStats>
  /** 批量获取 */
  mget: (keys: string[]) => Map<string, T>
  /** 批量设置 */
  mset: (entries: Array<[string, T]>, ttl?: number) => void
  /** 批量删除 */
  mdel: (keys: string[]) => void
  /** 清理过期项 */
  cleanup: () => number
  /** 监听事件 */
  on: (type: CacheEventType, listener: (event: any) => void) => void
  /** 移除事件监听 */
  off: (type: CacheEventType, listener: (event: any) => void) => void
}

/**
 * Vue 缓存 Composable
 * 
 * 提供响应式的缓存操作，自动管理生命周期
 * 
 * @template T - 缓存值类型
 * @param options - 缓存配置选项
 * @returns 缓存操作接口
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCache } from '@ldesign/cache/vue'
 * 
 * const { get, set, size, stats } = useCache<User>({
 *   strategy: 'lru',
 *   maxSize: 100,
 *   defaultTTL: 5000,
 *   enableStats: true
 * })
 * 
 * // 设置缓存
 * set('user:1', { id: 1, name: 'John' })
 * 
 * // 获取缓存
 * const user = get('user:1')
 * 
 * // 响应式统计
 * console.log('缓存大小:', size.value)
 * console.log('命中率:', stats.value.hitRate)
 * </script>
 * ```
 */
export function useCache<T = any>(options: UseCacheOptions = {}): UseCacheReturn<T> {
  const {
    autoCleanup = true,
    reactiveStats = true,
    ...cacheOptions
  } = options

  // 创建缓存管理器
  const cache = new CacheManager<T>(cacheOptions)

  // 响应式状态
  const size = ref(cache.size)
  const keys = shallowRef<string[]>([])
  const stats = ref<CacheStats>(cache.getStats())

  // 更新响应式状态
  const updateReactiveState = () => {
    size.value = cache.size
    keys.value = cache.keys()
    if (reactiveStats) {
      stats.value = cache.getStats()
    }
  }

  // 监听缓存变化，更新响应式状态
  if (reactiveStats) {
    cache.on('set', updateReactiveState)
    cache.on('delete', updateReactiveState)
    cache.on('clear', updateReactiveState)
    cache.on('evict', updateReactiveState)
    cache.on('expire', updateReactiveState)
  }

  // 组件卸载时清理
  if (autoCleanup) {
    onUnmounted(() => {
      cache.destroy()
    })
  }

  // 包装方法，确保响应式更新
  const get = (key: string): T | undefined => {
    const value = cache.get(key)
    if (reactiveStats) {
      stats.value = cache.getStats()
    }
    return value
  }

  const set = (key: string, value: T, ttl?: number): void => {
    cache.set(key, value, ttl)
    updateReactiveState()
  }

  const deleteKey = (key: string): boolean => {
    const result = cache.delete(key)
    if (result) {
      updateReactiveState()
    }
    return result
  }

  const clear = (): void => {
    cache.clear()
    updateReactiveState()
  }

  const mset = (entries: Array<[string, T]>, ttl?: number): void => {
    cache.mset(entries, { ttl })
    updateReactiveState()
  }

  const mdel = (keysToDelete: string[]): void => {
    cache.mdel(keysToDelete)
    updateReactiveState()
  }

  return {
    cache,
    get,
    set,
    delete: deleteKey,
    has: cache.has.bind(cache),
    clear,
    size: computed(() => size.value),
    keys: computed(() => keys.value),
    stats: computed(() => stats.value),
    mget: cache.mget.bind(cache),
    mset,
    mdel,
    cleanup: cache.cleanup.bind(cache),
    on: cache.on.bind(cache),
    off: cache.off.bind(cache),
  }
}

