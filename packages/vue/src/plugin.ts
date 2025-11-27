import type { CacheManager, CacheOptions } from '@ldesign/cache-core'
/**
 * Vue 3 缓存插件
 *
 * 提供 Vue 插件模式，支持 app.use() 安装
 *
 * @module plugin
 */
import type { App, Plugin } from 'vue'
import { createCache } from '@ldesign/cache-core'
import { CACHE_MANAGER_KEY } from './cache-provider'

/**
 * 插件配置选项
 */
export interface CachePluginOptions extends CacheOptions {
  /**
   * 自定义缓存管理器实例
   * 如果提供，将使用此实例而不是创建新实例
   */
  cacheManager?: CacheManager
}

/**
 * Vue 缓存插件
 *
 * 通过 app.use() 安装后，可以在任何组件中使用 useCache() 获取缓存实例
 *
 * @example
 * ```typescript
 * import { createApp } from 'vue'
 * import { cachePlugin } from '@ldesign/cache-vue'
 *
 * const app = createApp(App)
 *
 * // 使用默认配置
 * app.use(cachePlugin)
 *
 * // 自定义配置
 * app.use(cachePlugin, {
 *   defaultTTL: 5 * 60 * 1000, // 5分钟
 *   engines: {
 *     memory: {
 *       maxItems: 10000,
 *       evictionStrategy: 'LRU'
 *     }
 *   }
 * })
 *
 * app.mount('#app')
 * ```
 */
export const cachePlugin: Plugin<CachePluginOptions[]> = {
  install(app: App, options?: CachePluginOptions) {
    // 使用提供的缓存管理器或创建新实例
    const cacheManager = options?.cacheManager ?? createCache(options)

    // 提供给所有组件
    app.provide(CACHE_MANAGER_KEY, cacheManager)

    // 添加全局属性（可选，用于 Options API）
    app.config.globalProperties.$cache = cacheManager
  },
}

/**
 * 创建缓存插件实例
 *
 * 用于需要自定义配置的场景
 *
 * @param options - 插件配置选项
 * @returns Vue 插件实例
 *
 * @example
 * ```typescript
 * import { createCachePlugin } from '@ldesign/cache-vue'
 *
 * const myPlugin = createCachePlugin({
 *   defaultTTL: 10 * 60 * 1000,
 *   engines: {
 *     memory: {
 *       maxItems: 5000
 *     }
 *   }
 * })
 *
 * app.use(myPlugin)
 * ```
 */
export function createCachePlugin(options?: CachePluginOptions): Plugin {
  return {
    install(app: App) {
      cachePlugin.install(app, options)
    },
  }
}

/**
 * 声明全局属性类型
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    /**
     * 全局缓存管理器实例
     * 通过 cachePlugin 安装后可用
     */
    $cache: CacheManager
  }
}
