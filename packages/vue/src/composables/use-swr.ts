/**
 * SWR (Stale-While-Revalidate) Composable
 * 
 * 实现 SWR 缓存策略：先返回缓存数据，然后在后台重新验证
 * 
 * @module @ldesign/cache/vue/composables/use-swr
 */

import type { Ref } from 'vue'
import { onUnmounted, ref, watch } from 'vue'
import type { CacheManager } from '@ldesign/cache-core'

/**
 * SWR 选项
 */
export interface UseSWROptions<T> {
  /** 缓存�?*/
  key: string
  /** 数据获取函数 */
  fetcher: () => Promise<T>
  /** 重新验证间隔（毫秒）�? 表示禁用自动重新验证 */
  revalidateInterval?: number
  /** 窗口获得焦点时重新验�?*/
  revalidateOnFocus?: boolean
  /** 网络重新连接时重新验�?*/
  revalidateOnReconnect?: boolean
  /** 缓存 TTL（毫秒） */
  ttl?: number
  /** 是否立即执行 */
  immediate?: boolean
  /** 错误重试次数 */
  errorRetryCount?: number
  /** 错误重试间隔（毫秒） */
  errorRetryInterval?: number
  /** 是否在挂载时重新验证 */
  revalidateOnMount?: boolean
}

/**
 * SWR 返回�?
 */
export interface UseSWRReturn<T> {
  /** 数据 */
  data: Ref<T | undefined>
  /** 是否加载�?*/
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 是否正在重新验证 */
  isValidating: Ref<boolean>
  /** 手动重新验证 */
  mutate: (newData?: T) => Promise<void>
  /** 清除缓存 */
  clearCache: () => void
}

/**
 * 使用 SWR 缓存策略
 * 
 * @param cache - 缓存管理器实�?
 * @param options - SWR 选项
 * @returns SWR 结果
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCache, useSWR } from '@ldesign/cache/vue'
 * 
 * const { cache } = useCache()
 * 
 * const { data, loading, error, mutate } = useSWR(cache, {
 *   key: 'user:1',
 *   fetcher: async () => {
 *     const res = await fetch('/api/user/1')
 *     return res.json()
 *   },
 *   revalidateInterval: 30000, // 30 秒自动重新验�?
 *   revalidateOnFocus: true,
 * })
 * </script>
 * 
 * <template>
 *   <div v-if="loading">加载�?..</div>
 *   <div v-else-if="error">错误: {{ error.message }}</div>
 *   <div v-else>
 *     <p>{{ data }}</p>
 *     <button @click="mutate()">刷新</button>
 *   </div>
 * </template>
 * ```
 */
export function useSWR<T = any>(
  cache: CacheManager<T>,
  options: UseSWROptions<T>,
): UseSWRReturn<T> {
  const {
    key,
    fetcher,
    revalidateInterval = 0,
    revalidateOnFocus = false,
    revalidateOnReconnect = false,
    ttl,
    immediate = true,
    errorRetryCount = 3,
    errorRetryInterval = 5000,
    revalidateOnMount = true,
  } = options

  // 响应式状�?
  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isValidating = ref(false)

  let retryCount = 0
  let revalidateTimer: ReturnType<typeof setInterval> | null = null

  /**
   * 重新验证数据
   */
  async function revalidate(): Promise<void> {
    isValidating.value = true
    error.value = null

    try {
      const result = await fetcher()
      data.value = result
      cache.set(key, result, ttl)
      retryCount = 0 // 重置重试计数
    }
    catch (err) {
      error.value = err as Error

      // 错误重试
      if (retryCount < errorRetryCount) {
        retryCount++
        setTimeout(() => revalidate(), errorRetryInterval)
      }
    }
    finally {
      isValidating.value = false
      loading.value = false
    }
  }

  /**
   * 手动更新数据
   */
  async function mutate(newData?: T): Promise<void> {
    if (newData !== undefined) {
      data.value = newData
      cache.set(key, newData, ttl)
    }
    else {
      await revalidate()
    }
  }

  /**
   * 清除缓存
   */
  function clearCache(): void {
    cache.delete(key)
    data.value = undefined
  }

  /**
   * 初始化数�?
   */
  async function initialize(): Promise<void> {
    // 先尝试从缓存获取
    const cached = cache.get(key)
    if (cached !== undefined) {
      data.value = cached

      // 如果需要在挂载时重新验证，则在后台重新验证
      if (revalidateOnMount) {
        revalidate()
      }
    }
    else {
      // 缓存未命中，显示加载状态并获取数据
      loading.value = true
      await revalidate()
    }
  }

  // 设置自动重新验证
  if (revalidateInterval > 0) {
    revalidateTimer = setInterval(() => {
      revalidate()
    }, revalidateInterval)
  }

  // 窗口获得焦点时重新验�?
  if (revalidateOnFocus && typeof window !== 'undefined') {
    const handleFocus = () => revalidate()
    window.addEventListener('focus', handleFocus)
    onUnmounted(() => {
      window.removeEventListener('focus', handleFocus)
    })
  }

  // 网络重新连接时重新验�?
  if (revalidateOnReconnect && typeof window !== 'undefined') {
    const handleOnline = () => revalidate()
    window.addEventListener('online', handleOnline)
    onUnmounted(() => {
      window.removeEventListener('online', handleOnline)
    })
  }

  // 清理定时�?
  onUnmounted(() => {
    if (revalidateTimer) {
      clearInterval(revalidateTimer)
    }
  })

  // 立即执行
  if (immediate) {
    initialize()
  }

  return {
    data,
    loading,
    error,
    isValidating,
    mutate,
    clearCache,
  }
}

