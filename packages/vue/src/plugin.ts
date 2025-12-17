/**
 * Vue 缓存插件
 * 
 * 提供全局缓存实例和注入功�?
 * 
 * @module @ldesign/cache/vue/plugin
 */

import type { App, InjectionKey } from 'vue'
import type { CacheOptions } from '@ldesign/cache-core'
import { CacheManager } from '@ldesign/cache-core'

/**
 * 缓存注入�?
 */
export const CACHE_INJECTION_KEY: InjectionKey<CacheManager> = Symbol('cache')

/**
 * 缓存插件选项
 */
export interface CachePluginOptions extends CacheOptions {
  /** 全局属性名称，默认 '$cache' */
  globalPropertyName?: string
  /** 是否注入到组件，默认 true */
  inject?: boolean
}

/**
 * Vue 缓存插件
 * 
 * 提供全局缓存实例，可通过 inject �?this.$cache 访问
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { CachePlugin } from '@ldesign/cache/vue'
 * 
 * const app = createApp(App)
 * 
 * app.use(CachePlugin, {
 *   strategy: 'lru',
 *   maxSize: 100,
 *   defaultTTL: 5000,
 *   enableStats: true,
 *   globalPropertyName: '$cache'
 * })
 * ```
 * 
 * 在组件中使用�?
 * ```vue
 * <script setup lang="ts">
 * import { inject } from 'vue'
 * import { CACHE_INJECTION_KEY } from '@ldesign/cache/vue'
 * 
 * const cache = inject(CACHE_INJECTION_KEY)
 * 
 * // 使用缓存
 * cache?.set('key', 'value')
 * const value = cache?.get('key')
 * </script>
 * ```
 * 
 * 或使用全局属性（Options API）：
 * ```vue
 * <script>
 * export default {
 *   mounted() {
 *     // 使用全局属�?
 *     this.$cache.set('key', 'value')
 *     const value = this.$cache.get('key')
 *   }
 * }
 * </script>
 * ```
 */
export const CachePlugin = {
  install(app: App, options: CachePluginOptions = {}) {
    const {
      globalPropertyName = '$cache',
      inject = true,
      ...cacheOptions
    } = options

    // 创建全局缓存实例
    const cache = new CacheManager(cacheOptions)

    // 注入到组�?
    if (inject) {
      app.provide(CACHE_INJECTION_KEY, cache)
    }

    // 添加全局属�?
    if (globalPropertyName) {
      app.config.globalProperties[globalPropertyName] = cache
    }

    // 在应用卸载时清理
    const originalUnmount = app.unmount
    app.unmount = function () {
      cache.destroy()
      originalUnmount.call(this)
    }
  },
}

/**
 * 创建缓存插件
 * @param options - 插件选项
 * @returns Vue 插件
 */
export function createCachePlugin(options: CachePluginOptions = {}) {
  return {
    install(app: App) {
      CachePlugin.install(app, options)
    },
  }
}

/**
 * TypeScript 类型扩展
 * 
 * �?Vue 组件实例添加 $cache 类型
 */
declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $cache: CacheManager
  }
}

