/**
 * @ldesign/cache engine plugin.
 */

import { CacheManager } from '../cache-manager'
import type { CacheEnginePluginApi, CacheEnginePluginContext, CacheEnginePluginOptions, EngineLike } from './types'

export const cacheStateKeys = {
  MANAGER: 'cache:manager' as const,
  CONTEXT: 'cache:context' as const,
} as const

export const cacheEventKeys = {
  INSTALLED: 'cache:installed' as const,
  UNINSTALLED: 'cache:uninstalled' as const,
} as const

export function createCacheEnginePlugin(options: CacheEnginePluginOptions = {}) {
  const {
    name = 'cache',
    version = '2.0.0',
    dependencies = [],
    manager: externalManager,
    registerApi = true,
    ...cacheOptions
  } = options

  let manager: CacheManager<any> | null = null
  let pluginContext: CacheEnginePluginContext | null = null
  const ownsManager = !externalManager

  return {
    name,
    version,
    dependencies,

    async install(context: any) {
      const engine: EngineLike = context?.engine || context
      if (!engine) {
        throw new Error('[Cache Plugin] engine instance not found')
      }

      manager = externalManager ?? new CacheManager(cacheOptions)
      pluginContext = {
        engine,
        manager,
        options,
      }

      engine.state?.set?.(cacheStateKeys.MANAGER, manager)
      engine.state?.set?.(cacheStateKeys.CONTEXT, pluginContext)

      if (registerApi && engine.api?.register) {
        const api: CacheEnginePluginApi = {
          name: 'cache',
          version,
          getInstance: () => manager,
          getContext: () => pluginContext,
          get: key => manager?.get(key),
          set: (key, value, setOptions) => manager?.set(key, value, setOptions as any),
          delete: key => manager?.delete(key) ?? false,
          clear: () => manager?.clear(),
          invalidateByTag: tag => manager?.invalidateByTag(tag) ?? 0,
          invalidateByNamespace: namespace => manager?.invalidateByNamespace(namespace) ?? 0,
          query: manager.query,
        }
        engine.api.register(api)
      }

      engine.events?.emit?.(cacheEventKeys.INSTALLED, {
        name,
        version,
      })

      engine.logger?.info?.('[Cache Plugin] installed', {
        strategy: (cacheOptions as any).strategy,
        maxSize: (cacheOptions as any).maxSize,
      })
    },

    async uninstall(context: any) {
      const engine: EngineLike = context?.engine || context

      engine.api?.unregister?.('cache')
      engine.state?.delete?.(cacheStateKeys.MANAGER)
      engine.state?.delete?.(cacheStateKeys.CONTEXT)

      if (ownsManager && manager) {
        manager.destroy()
      }

      manager = null
      pluginContext = null

      engine.events?.emit?.(cacheEventKeys.UNINSTALLED, {
        name,
      })

      engine.logger?.info?.('[Cache Plugin] uninstalled')
    },

    getInstance() {
      return manager
    },

    getContext() {
      return pluginContext
    },
  }
}
