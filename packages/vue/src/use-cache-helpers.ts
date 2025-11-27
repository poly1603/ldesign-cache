import type { SerializableValue } from '@ldesign/cache-core'
/**
 * 缓存辅助组合式函数
 *
 * 提供便捷的缓存操作辅助函数
 *
 * @module use-cache-helpers
 */
import type { ComputedRef, Ref } from 'vue'
import { onUnmounted, ref, watch } from 'vue'
import { useCache } from './use-cache'

/**
 * 缓存值返回类型
 */
export interface UseCacheValueReturn<T> {
  /** 缓存值 */
  value: ComputedRef<T | null>
  /** 是否正在加载 */
  loading: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<Error | null>
  /** 是否存在 */
  exists: ComputedRef<boolean>
  /** 设置值 */
  set: (value: T) => Promise<void>
  /** 刷新值 */
  refresh: () => Promise<void>
  /** 删除值 */
  remove: () => Promise<void>
}

/**
 * 简单值缓存
 *
 * @param key - 缓存键
 * @param defaultValue - 默认值
 * @param options - 配置选项
 * @param options.ttl - 缓存过期时间（毫秒）
 * @param options.immediate - 是否立即加载
 * @returns 缓存值和操作方法
 *
 * @example
 * ```typescript
 * const { value, set, refresh } = useCacheValue<User>('user', null, {
 *   ttl: 60000
 * })
 *
 * // 设置值
 * await set({ name: '张三' })
 *
 * // 访问值
 * console.log(value.value)
 * ```
 */
export function useCacheValue<T extends SerializableValue = SerializableValue>(
  key: string,
  defaultValue?: T,
  options?: { ttl?: number, immediate?: boolean },
): UseCacheValueReturn<T> {
  const { useReactiveCache } = useCache()
  const cache = useReactiveCache<T>(key, defaultValue)

  return {
    value: cache.value,
    loading: cache.loading,
    error: cache.error,
    exists: cache.exists,
    set: async (value: T) => cache.set(value, options?.ttl ? { ttl: options.ttl } : undefined),
    refresh: cache.refresh,
    remove: cache.remove,
  }
}

/**
 * 双向绑定缓存返回类型
 */
export interface UseCacheSyncReturn<T> {
  /** 可写的缓存值（支持 v-model） */
  value: Ref<T | null>
  /** 是否正在加载 */
  loading: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<Error | null>
  /** 刷新值 */
  refresh: () => Promise<void>
  /** 删除值 */
  remove: () => Promise<void>
}

/**
 * 双向绑定缓存
 *
 * 支持 v-model 的缓存值，自动同步到缓存
 *
 * @param key - 缓存键
 * @param defaultValue - 默认值
 * @param options - 配置选项
 * @param options.ttl - 缓存过期时间（毫秒）
 * @param options.debounce - 防抖延迟时间（毫秒），默认 300
 * @returns 可写的缓存值和操作方法
 *
 * @example
 * ```vue
 * <template>
 *   <input v-model="value" />
 * </template>
 *
 * <script setup>
 * const { value } = useCacheSync<string>('input-value', '')
 * </script>
 * ```
 */
export function useCacheSync<T extends SerializableValue = SerializableValue>(
  key: string,
  defaultValue?: T,
  options?: { ttl?: number, debounce?: number },
): UseCacheSyncReturn<T> {
  const { useReactiveCache } = useCache()
  const cache = useReactiveCache<T>(key, defaultValue)

  // 创建可写的 ref
  const syncValue = ref<T | null>(defaultValue ?? null) as Ref<T | null>
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  // 监听缓存值变化，同步到 syncValue
  watch(
    cache.value,
    (newValue) => {
      syncValue.value = newValue
    },
    { immediate: true },
  )

  // 监听 syncValue 变化，同步到缓存
  watch(
    syncValue,
    (newValue) => {
      if (newValue === null)
        return

      // 防抖处理
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      const delay = options?.debounce ?? 300
      debounceTimer = setTimeout(() => {
        cache.set(newValue, options?.ttl ? { ttl: options.ttl } : undefined)
      }, delay)
    },
    { deep: true },
  )

  // 组件卸载时清理定时器，避免内存泄漏
  onUnmounted(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = undefined
    }
  })

  return {
    value: syncValue,
    loading: cache.loading,
    error: cache.error,
    refresh: cache.refresh,
    remove: cache.remove,
  }
}
