import type { CacheStats } from '@ldesign/cache-core'
/**
 * 缓存统计组合式函数
 *
 * 提供响应式的缓存统计信息
 *
 * @module use-cache-stats
 */
import type { ComputedRef } from 'vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useCache } from './use-cache'

/**
 * useCacheStats 返回类型
 */
export interface UseCacheStatsReturn {
  /** 缓存统计信息 */
  stats: ComputedRef<CacheStats | null>
  /** 是否正在加载 */
  loading: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<Error | null>
  /** 刷新统计信息 */
  refresh: () => Promise<void>
  /** 命中率（百分比） */
  hitRatePercent: ComputedRef<string>
  /** 总请求数 */
  totalRequests: ComputedRef<number>
}

/**
 * 缓存统计组合式函数
 *
 * @param options - 配置选项
 * @param options.autoRefresh - 是否自动刷新
 * @param options.refreshInterval - 刷新间隔（毫秒）
 * @returns 统计信息和操作方法
 *
 * @example
 * ```typescript
 * const { stats, hitRatePercent, refresh } = useCacheStats({
 *   autoRefresh: true,
 *   refreshInterval: 5000
 * })
 *
 * // 显示命中率
 * console.log(`命中率: ${hitRatePercent.value}`)
 * ```
 */
export function useCacheStats(options?: {
  autoRefresh?: boolean
  refreshInterval?: number
}): UseCacheStatsReturn {
  const { getStats } = useCache()

  const stats = ref<CacheStats | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  let refreshTimer: ReturnType<typeof setInterval> | undefined

  /**
   * 刷新统计信息
   */
  const refresh = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      stats.value = await getStats()
    }
    catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    }
    finally {
      loading.value = false
    }
  }

  // 计算属性
  const hitRatePercent = computed(() => {
    if (!stats.value)
      return '0.00%'
    return `${(stats.value.hitRate * 100).toFixed(2)}%`
  })

  const totalRequests = computed(() => {
    if (!stats.value)
      return 0
    return stats.value.hits + stats.value.misses
  })

  // 初始化时加载
  onMounted(() => {
    refresh()

    // 自动刷新
    if (options?.autoRefresh) {
      const interval = options.refreshInterval ?? 5000
      refreshTimer = setInterval(refresh, interval)
    }
  })

  // 清理定时器
  onUnmounted(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }
  })

  return {
    stats: computed(() => stats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    refresh,
    hitRatePercent,
    totalRequests,
  }
}
