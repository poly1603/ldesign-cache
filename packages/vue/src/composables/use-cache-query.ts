/**
 * 缓存查询 Composable
 * 
 * 提供带缓存的异步数据查询功能
 * 
 * @module @ldesign/cache/vue/composables/use-cache-query
 */

import type { Ref } from 'vue'
import { ref, watch } from 'vue'
import type { CacheManager } from '@ldesign/cache/core'

/**
 * 查询选项
 */
export interface UseCacheQueryOptions<T> {
  /** 缓存键 */
  key: string
  /** 查询函数 */
  queryFn: () => Promise<T>
  /** 缓存 TTL（毫秒） */
  ttl?: number
  /** 是否立即执行 */
  immediate?: boolean
  /** 是否启用缓存 */
  enabled?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}

/**
 * 查询返回值
 */
export interface UseCacheQueryReturn<T> {
  /** 查询数据 */
  data: Ref<T | undefined>
  /** 是否加载中 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<Error | null>
  /** 是否来自缓存 */
  isFromCache: Ref<boolean>
  /** 重新查询 */
  refetch: () => Promise<void>
  /** 清除缓存 */
  clearCache: () => void
}

/**
 * 使用缓存查询
 * 
 * @param cache - 缓存管理器实例
 * @param options - 查询选项
 * @returns 查询结果
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCache, useCacheQuery } from '@ldesign/cache/vue'
 * 
 * const { cache } = useCache()
 * 
 * const { data, loading, error, refetch } = useCacheQuery(cache, {
 *   key: 'user:1',
 *   queryFn: async () => {
 *     const res = await fetch('/api/user/1')
 *     return res.json()
 *   },
 *   ttl: 5 * 60 * 1000, // 5 分钟
 * })
 * </script>
 * 
 * <template>
 *   <div v-if="loading">加载中...</div>
 *   <div v-else-if="error">错误: {{ error.message }}</div>
 *   <div v-else>{{ data }}</div>
 * </template>
 * ```
 */
export function useCacheQuery<T = any>(
  cache: CacheManager<T>,
  options: UseCacheQueryOptions<T>,
): UseCacheQueryReturn<T> {
  const {
    key,
    queryFn,
    ttl,
    immediate = true,
    enabled = true,
    retryCount = 0,
    retryDelay = 1000,
  } = options

  // 响应式状态
  const data = ref<T>()
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const isFromCache = ref(false)

  /**
   * 执行查询
   */
  async function execute(retries = 0): Promise<void> {
    if (!enabled) {
      return
    }

    // 先检查缓存
    const cached = cache.get(key)
    if (cached !== undefined) {
      data.value = cached
      isFromCache.value = true
      return
    }

    // 缓存未命中，执行查询
    loading.value = true
    error.value = null
    isFromCache.value = false

    try {
      const result = await queryFn()
      data.value = result
      cache.set(key, result, ttl)
    }
    catch (err) {
      error.value = err as Error

      // 重试逻辑
      if (retries < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return execute(retries + 1)
      }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 重新查询
   */
  async function refetch(): Promise<void> {
    cache.delete(key)
    await execute()
  }

  /**
   * 清除缓存
   */
  function clearCache(): void {
    cache.delete(key)
  }

  // 立即执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    isFromCache,
    refetch,
    clearCache,
  }
}

