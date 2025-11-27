<script setup lang="ts">
/**
 * CacheProvider 组件
 * 
 * 提供缓存上下文给子组件
 * 
 * @module @ldesign/cache/vue/components/CacheProvider
 */

import { provide } from 'vue'
import type { CacheOptions } from '@ldesign/cache/core'
import { CacheManager } from '@ldesign/cache/core'
import { CACHE_INJECTION_KEY } from '../plugin'

/**
 * 组件属性
 */
interface Props {
  /** 缓存选项 */
  options?: CacheOptions
  /** 缓存管理器实例（可选，如果不提供则创建新实例） */
  cache?: CacheManager
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
})

// 创建或使用提供的缓存实例
const cacheInstance = props.cache ?? new CacheManager(props.options)

// 提供给子组件
provide(CACHE_INJECTION_KEY, cacheInstance)

// 暴露缓存实例
defineExpose({
  cache: cacheInstance,
})
</script>

<template>
  <slot :cache="cacheInstance" />
</template>

