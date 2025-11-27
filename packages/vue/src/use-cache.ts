import type { CacheManager, CacheStats, SerializableValue, SetOptions, StorageEngine } from '@ldesign/cache-core'
/**
 * Vue 3 缓存组合式函数
 *
 * 提供响应式的缓存管理功能
 *
 * @module use-cache
 */
import type { ComputedRef, Ref } from 'vue'
import type { UseCacheOptions } from './types'
import { createCache } from '@ldesign/cache-core'
import { computed, inject, onUnmounted, ref } from 'vue'
import { CACHE_MANAGER_KEY } from './cache-provider'

/**
 * 响应式缓存返回类型
 */
export interface ReactiveCache<T extends SerializableValue = SerializableValue> {
  /** 缓存值 */
  value: ComputedRef<T | null>
  /** 是否正在加载 */
  loading: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<Error | null>
  /** 是否存在 */
  exists: ComputedRef<boolean>
  /** 设置缓存值 */
  set: (value: T, options?: SetOptions) => Promise<void>
  /** 刷新缓存 */
  refresh: () => Promise<void>
  /** 移除缓存 */
  remove: () => Promise<void>
}

/**
 * useCache 返回类型
 */
export interface UseCacheReturn {
  /** 设置缓存项 */
  set: <T extends SerializableValue>(key: string, value: T, options?: SetOptions) => Promise<void>
  /** 获取缓存项 */
  get: <T extends SerializableValue>(key: string) => Promise<T | null>
  /** 移除缓存项 */
  remove: (key: string) => Promise<void>
  /** 清空所有缓存 */
  clear: (engine?: StorageEngine) => Promise<void>
  /** 检查缓存项是否存在 */
  has: (key: string) => Promise<boolean>
  /** 获取所有缓存键 */
  keys: (engine?: StorageEngine) => Promise<string[]>
  /** 获取缓存统计信息 */
  getStats: () => Promise<CacheStats>
  /** 响应式统计信息 */
  stats: ComputedRef<CacheStats | null>
  /** 是否正在加载 */
  loading: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<Error | null>
  /** 创建响应式缓存 */
  useReactiveCache: <T extends SerializableValue>(key: string, defaultValue?: T) => ReactiveCache<T>
  /** 缓存管理器实例 */
  manager: CacheManager
}

/**
 * Vue 3 缓存组合式函数
 *
 * @param options - 缓存配置选项
 * @returns 缓存操作方法和状态
 *
 * @example
 * ```typescript
 * const { set, get, useReactiveCache } = useCache()
 *
 * // 基础操作
 * await set('user', { name: '张三' })
 * const user = await get<User>('user')
 *
 * // 响应式缓存
 * const userCache = useReactiveCache<User>('user')
 * console.log(userCache.value.value) // 响应式访问
 * ```
 */
export function useCache(options?: UseCacheOptions): UseCacheReturn {
  const injectedManager = inject(CACHE_MANAGER_KEY, null as unknown as CacheManager | null)
  const cacheManager = injectedManager ?? createCache(options)

  const loading = ref(false)
  const error = ref<Error | null>(null)
  const stats = ref<CacheStats | null>(null)

  const set = async <T extends SerializableValue>(key: string, value: T, setOptions?: SetOptions): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await cacheManager.set(key, value, setOptions)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const get = async <T extends SerializableValue>(key: string): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      return await cacheManager.get<T>(key)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const remove = async (key: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await cacheManager.remove(key)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const clear = async (engine?: StorageEngine): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await cacheManager.clear(engine)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const has = async (key: string): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      return await cacheManager.has(key)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const keys = async (engine?: StorageEngine): Promise<string[]> => {
    loading.value = true
    error.value = null
    try {
      return await cacheManager.keys(engine)
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getStats = async (): Promise<CacheStats> => {
    loading.value = true
    error.value = null
    try {
      const result = await cacheManager.getStats()
      stats.value = result
      return result
    }
    catch (err) {
      error.value = err as Error
      throw err
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 创建响应式缓存
   */
  const useReactiveCache = <T extends SerializableValue>(key: string, defaultValue?: T): ReactiveCache<T> => {
    const value = ref<T | null>(defaultValue ?? null) as Ref<T | null>
    const isLoading = ref(false)
    const cacheError = ref<Error | null>(null)

    const load = async (): Promise<void> => {
      isLoading.value = true
      cacheError.value = null
      try {
        const cached = await get<T>(key)
        value.value = cached !== null ? cached : (defaultValue ?? null)
      }
      catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err))
        value.value = defaultValue ?? null
      }
      finally {
        isLoading.value = false
      }
    }

    const save = async (newValue: T, setOptions?: SetOptions): Promise<void> => {
      isLoading.value = true
      cacheError.value = null
      try {
        await set(key, newValue, setOptions)
        value.value = newValue
      }
      catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err))
        throw err
      }
      finally {
        isLoading.value = false
      }
    }

    const removeValue = async (): Promise<void> => {
      isLoading.value = true
      cacheError.value = null
      try {
        await remove(key)
        value.value = defaultValue ?? null
      }
      catch (err) {
        cacheError.value = err instanceof Error ? err : new Error(String(err))
        throw err
      }
      finally {
        isLoading.value = false
      }
    }

    // 初始化时加载数据
    if (options?.immediate !== false) {
      load().catch(console.error)
    }

    return {
      value: computed(() => value.value),
      loading: computed(() => isLoading.value),
      error: computed(() => cacheError.value),
      exists: computed(() => value.value !== null && value.value !== undefined),
      set: save,
      refresh: load,
      remove: removeValue,
    }
  }

  // 组件卸载时清理
  const createdLocally = !injectedManager
  if (createdLocally) {
    onUnmounted(() => {
      cacheManager.destroy?.()
    })
  }

  return {
    set,
    get,
    remove,
    clear,
    has,
    keys,
    getStats,
    stats: computed(() => stats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    useReactiveCache,
    manager: cacheManager,
  }
}

/**
 * 获取单个缓存键的响应式值
 *
 * @param key - 缓存键
 * @param options - 配置选项
 * @returns 响应式缓存对象
 */
export function useCacheKey<T extends SerializableValue = SerializableValue>(
  key: string,
  options?: UseCacheOptions & { defaultValue?: T },
): ReactiveCache<T> {
  const { useReactiveCache } = useCache(options)
  return useReactiveCache<T>(key, options?.defaultValue)
}

/**
 * 获取多个缓存键的响应式值
 *
 * @param keys - 缓存键数组
 * @param options - 配置选项
 * @returns 响应式缓存对象数组
 */
export function useCacheKeys<T extends SerializableValue = SerializableValue>(
  keys: string[],
  options?: UseCacheOptions,
): ReactiveCache<T>[] {
  const { useReactiveCache } = useCache(options)
  return keys.map(key => useReactiveCache<T>(key))
}
