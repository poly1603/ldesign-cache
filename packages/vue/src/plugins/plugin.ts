/**
 * Native Vue plugin adapter.
 */

import type { App, Plugin } from 'vue'
import type { CacheManager, CacheOptions } from '@ldesign/cache-core'
import { CacheManager as CoreCacheManager } from '@ldesign/cache-core'
import { CacheProvider } from '../components'
import { CACHE_INJECTION_KEY } from '../constants'
import { vCache } from '../directives'

export interface CachePluginOptions<T = unknown> extends CacheOptions<T> {
  cache?: CacheManager<T>
  globalPropertyName?: string | false
  provide?: boolean
  registerDirective?: boolean
  registerComponents?: boolean
  autoDestroy?: boolean
}

function installCachePlugin<T = unknown>(app: App, options: CachePluginOptions<T> = {}): void {
  const {
    cache,
    globalPropertyName = '$cache',
    provide = true,
    registerDirective = true,
    registerComponents = true,
    autoDestroy = true,
    ...cacheOptions
  } = options

  const manager = cache ?? new CoreCacheManager<T>(cacheOptions)
  const ownsManager = !cache

  if (provide) {
    app.provide(CACHE_INJECTION_KEY, manager)
  }

  if (globalPropertyName) {
    ;(app.config.globalProperties as Record<string, unknown>)[globalPropertyName] = manager
  }

  if (registerDirective) {
    app.directive('cache', vCache)
  }

  if (registerComponents) {
    app.component(CacheProvider.name!, CacheProvider)
  }

  if (ownsManager && autoDestroy) {
    const rawUnmount = app.unmount
    app.unmount = (...args: any[]) => {
      manager.destroy()
      return rawUnmount(...args)
    }
  }
}

export const CachePlugin: Plugin = {
  install(app, options: CachePluginOptions = {}) {
    installCachePlugin(app, options)
  },
}

export function createCachePlugin<T = unknown>(options: CachePluginOptions<T> = {}): Plugin {
  return {
    install(app) {
      installCachePlugin(app, options)
    },
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $cache: CacheManager<any>
  }
}
