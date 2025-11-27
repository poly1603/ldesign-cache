/**
 * Cache Engine Plugin
 *
 * 将 Cache 功能集成到 LDesign Engine
 *
 * @example
 * ```ts
 * import { createVueEngine } from '@ldesign/engine-vue3'
 * import { createCacheEnginePlugin } from '@ldesign/cache-vue/plugins'
 *
 * const engine = createVueEngine({
 *   plugins: [
 *     createCacheEnginePlugin({
 *       defaultTTL: 5 * 60 * 1000, // 5分钟
 *       engines: {
 *         memory: {
 *           maxItems: 10000,
 *           evictionStrategy: 'LRU'
 *         }
 *       }
 *     })
 *   ]
 * })
 * ```
 */
import type { CacheManager, CacheOptions } from '@ldesign/cache-core'
import { createCache } from '@ldesign/cache-core'
import { cachePlugin } from '../plugin'

/**
 * Engine Plugin 接口 (临时定义，等待 @ldesign/engine-core 包)
 */
export interface Plugin<Options = Record<string, unknown>> {
  readonly name: string
  readonly version?: string
  readonly dependencies?: string[]
  install: (context: PluginContext, options?: Options) => void | Promise<void>
  uninstall?: (context: PluginContext) => void | Promise<void>
}

/**
 * Plugin API 接口
 */
export interface PluginAPI {
  name: string
  version: string
  [key: string]: unknown
}

/**
 * Plugin Context 接口 (临时定义)
 */
export interface PluginContext {
  engine: {
    state: {
      set: (key: string, value: unknown) => void
      get: (key: string) => unknown
      delete: (key: string) => void
    }
    api: {
      register: (api: PluginAPI) => void
      get: (name: string) => unknown
      unregister: (name: string) => void
    }
    events: {
      emit: (event: string, data?: unknown) => void
      on: (event: string, handler: (data?: unknown) => void) => void
      off: (event: string, handler: (data?: unknown) => void) => void
    }
    getApp: () => unknown
  }
}

/**
 * Cache Engine 插件选项
 */
export interface CacheEnginePluginOptions extends CacheOptions {
  /** 插件名称 */
  name?: string
  /** 插件版本 */
  version?: string
  /** 是否启用调试 */
  debug?: boolean
  /** Vue 全局属性名 */
  globalPropertyName?: string
}

/**
 * 创建 Cache Engine 插件
 *
 * @param options - 插件配置选项
 * @returns Engine Plugin
 */
export function createCacheEnginePlugin(
  options: CacheEnginePluginOptions = {},
): Plugin {
  const {
    name = 'cache',
    version = '1.0.0',
    debug = false,
    globalPropertyName: _globalPropertyName = '$cache',
    ...cacheOptions
  } = options

  return {
    name,
    version,

    async install(context: PluginContext) {
      const { engine } = context

      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[Cache Plugin] Installing...')
      }

      // 1. 创建缓存管理器实例
      const cacheManager = createCache(cacheOptions)

      // 2. 注册到 Engine State (全局状态)
      engine.state.set('cache:instance', cacheManager)

      // 3. 注册到 Engine API (API 访问)
      engine.api.register({
        name,
        version,

        /** 获取缓存管理器实例 */
        getInstance: () => cacheManager,

        /** 获取缓存值 */
        get: <T>(key: string) => cacheManager.get<T>(key),

        /** 设置缓存值 */
        set: <T>(key: string, value: T, opts?: { ttl?: number }) =>
          cacheManager.set(key, value, opts),

        /** 删除缓存值 */
        remove: (key: string) => cacheManager.remove(key),

        /** 清空缓存 */
        clear: () => cacheManager.clear(),

        /** 检查键是否存在 */
        has: (key: string) => cacheManager.has(key),

        /** 获取所有键 */
        keys: () => cacheManager.keys(),

        /** 获取统计信息 */
        getStats: () => cacheManager.getStats(),

        /** 记忆函数 */
        remember: <T>(
          key: string,
          fetcher: () => Promise<T> | T,
          opts?: { ttl?: number, refresh?: boolean },
        ) => cacheManager.remember(key, fetcher, opts),
      })

      // 4. 安装 Vue 插件
      const app = engine.getApp()
      if (app && typeof app === 'object' && 'use' in app) {
        (app as { use: (plugin: unknown) => void }).use(cachePlugin, {
          cacheManager,
        })
      }

      if (debug) {
        // eslint-disable-next-line no-console
        console.log('[Cache Plugin] Installed successfully')
        const stats = await cacheManager.getStats()
        // eslint-disable-next-line no-console
        console.log('[Cache Plugin] Initial stats:', stats)
      }
    },

    async uninstall(context: PluginContext) {
      const { engine } = context

      // 清理资源
      const cacheManager = engine.state.get('cache:instance') as CacheManager | undefined
      if (cacheManager && typeof cacheManager.destroy === 'function') {
        cacheManager.destroy()
      }

      // 清理状态
      engine.state.delete('cache:instance')

      // 注销 API
      engine.api.unregister('cache')
    },
  }
}

/**
 * 默认 Cache Engine 插件
 */
export const cacheEnginePlugin = createCacheEnginePlugin()
