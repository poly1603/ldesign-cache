/**
 * 插件模块导出
 *
 * @module plugins
 */

export {
  cacheEnginePlugin,
  createCacheEnginePlugin,
} from './engine-plugin'

export type {
  CacheEnginePluginOptions,
  Plugin,
  PluginAPI,
  PluginContext,
} from './engine-plugin'
