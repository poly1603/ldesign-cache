/**
 * Engine adapter plugin for Vue + cache core.
 */

import {
  createCacheEnginePlugin as createCoreCacheEnginePlugin,
  type CacheEnginePluginContext,
  type CacheEnginePluginOptions as CoreCacheEnginePluginOptions,
  type EngineLike,
} from '@ldesign/cache-core'
import type { CacheManager } from '@ldesign/cache-core'
import { createCachePlugin, type CachePluginOptions } from './plugin'

export interface CacheEnginePluginOptions extends CoreCacheEnginePluginOptions {
  installVuePlugin?: boolean
  vue?: Omit<CachePluginOptions, 'cache' | 'autoDestroy'>
}

export function createCacheEnginePlugin(options: CacheEnginePluginOptions = {}) {
  const {
    installVuePlugin = true,
    vue: vueOptions = {},
    ...coreOptions
  } = options

  const corePlugin = createCoreCacheEnginePlugin(coreOptions)
  let vueInstalled = false

  const installToVue = (app: any, manager: CacheManager<any>) => {
    if (vueInstalled || !app) {
      return
    }

    app.use(createCachePlugin({
      ...vueOptions,
      cache: manager,
      autoDestroy: false,
    }))

    vueInstalled = true
  }

  return {
    name: corePlugin.name,
    version: corePlugin.version,
    dependencies: corePlugin.dependencies,

    async install(context: any) {
      await corePlugin.install(context)

      if (!installVuePlugin) {
        return
      }

      const manager = (corePlugin as any).getInstance?.() as CacheManager<any> | null
      if (!manager) {
        throw new Error('[Cache Vue Engine Plugin] core plugin did not provide cache manager')
      }

      const engine: EngineLike & { getApp?: () => any } = context?.engine || context
      const app = engine.getApp?.()

      if (app) {
        installToVue(app, manager)
      }
      else {
        engine.events?.once?.('app:created', () => {
          const nextApp = engine.getApp?.()
          if (nextApp) {
            installToVue(nextApp, manager)
          }
        })
      }
    },

    async uninstall(context: any) {
      await corePlugin.uninstall?.(context)
      vueInstalled = false
    },

    getInstance() {
      return (corePlugin as any).getInstance?.() ?? null
    },

    getContext(): CacheEnginePluginContext | null {
      return (corePlugin as any).getContext?.() ?? null
    },
  }
}
