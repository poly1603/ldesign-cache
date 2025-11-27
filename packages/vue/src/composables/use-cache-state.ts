/**
 * 缓存状态管理 Composable
 * 
 * 提供响应式的缓存状态管理
 * 
 * @module @ldesign/cache/vue/composables/use-cache-state
 */

import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'
import type { CacheManager } from '@ldesign/cache/core'
import { CacheEventType } from '@ldesign/cache/core'

/**
 * 缓存状态选项
 */
export interface UseCacheStateOptions {
  /** 是否自动同步 */
  autoSync?: boolean
  /** 同步间隔（毫秒） */
  syncInterval?: number
}

/**
 * 缓存状态返回值
 */
export interface UseCacheStateReturn {
  /** 缓存大小 */
  size: Ref<number>
  /** 所有键 */
  keys: Ref<string[]>
  /** 命中率 */
  hitRate: Ref<number>
  /** 是否为空 */
  isEmpty: Ref<boolean>
  /** 是否已满 */
  isFull: Ref<boolean>
  /** 刷新状态 */
  refresh: () => void
}

/**
 * 使用缓存状态
 * 
 * @param cache - 缓存管理器实例
 * @param options - 选项
 * @returns 缓存状态
 * 
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useCache, useCacheState } from '@ldesign/cache/vue'
 * 
 * const { cache } = useCache()
 * const { size, hitRate, isEmpty } = useCacheState(cache)
 * </script>
 * 
 * <template>
 *   <div>
 *     <p>缓存大小: {{ size }}</p>
 *     <p>命中率: {{ (hitRate * 100).toFixed(2) }}%</p>
 *     <p>是否为空: {{ isEmpty }}</p>
 *   </div>
 * </template>
 * ```
 */
export function useCacheState<T = any>(
  cache: CacheManager<T>,
  options: UseCacheStateOptions = {},
): UseCacheStateReturn {
  const { autoSync = true, syncInterval = 1000 } = options

  // 响应式状态
  const size = ref(cache.size)
  const keys = ref(cache.keys())
  const stats = ref(cache.getStats())

  // 计算属性
  const hitRate = computed(() => stats.value.hitRate)
  const isEmpty = computed(() => size.value === 0)
  const isFull = computed(() => size.value >= stats.value.maxSize)

  /**
   * 刷新状态
   */
  function refresh(): void {
    size.value = cache.size
    keys.value = cache.keys()
    stats.value = cache.getStats()
  }

  // 监听缓存事件
  if (autoSync) {
    cache.on(CacheEventType.SET, refresh)
    cache.on(CacheEventType.DELETE, refresh)
    cache.on(CacheEventType.CLEAR, refresh)
    cache.on(CacheEventType.EVICT, refresh)
  }

  // 定时同步
  let timerId: ReturnType<typeof setInterval> | null = null
  if (autoSync && syncInterval > 0) {
    timerId = setInterval(refresh, syncInterval)
  }

  // 清理
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (timerId) {
        clearInterval(timerId)
      }
    })
  }

  return {
    size,
    keys,
    hitRate,
    isEmpty,
    isFull,
    refresh,
  }
}

