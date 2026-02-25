/**
 * @ldesign/cache Engine 插件
 */
import type { CacheEnginePluginOptions } from './types'
import { CacheManager } from '../cache-manager'

export const cacheStateKeys = {
  MANAGER: 'cache:manager' as const,
} as const

export const cacheEventKeys = {
  INSTALLED: 'cache:installed' as const,
  UNINSTALLED: 'cache:uninstalled' as const,
} as const

export function createCacheEnginePlugin(options: CacheEnginePluginOptions = {}) {
  let manager: CacheManager<any> | null = null
  return {
    name: 'cache',
    version: '1.0.0',
    dependencies: options.dependencies ?? [],

    async install(context: any) {
      const engine = context.engine || context
      manager = new CacheManager(options as any)
      engine.state?.set(cacheStateKeys.MANAGER, manager)
      engine.events?.emit(cacheEventKeys.INSTALLED, { name: 'cache' })
      engine.logger?.info('[Cache Plugin] installed')
    },

    async uninstall(context: any) {
      const engine = context.engine || context
      if (manager) { await manager.clear(); manager = null }
      engine.state?.delete(cacheStateKeys.MANAGER)
      engine.events?.emit(cacheEventKeys.UNINSTALLED, {})
      engine.logger?.info('[Cache Plugin] uninstalled')
    },
  }
}
