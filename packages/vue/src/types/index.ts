/**
 * Vue adapter type exports.
 */

export { CACHE_INJECTION_KEY } from '../constants'

export type { CachePluginOptions } from '../plugins/plugin'
export type { CacheEnginePluginOptions } from '../plugins/engine-plugin'

export type { UseCacheOptions, UseCacheReturn } from '../composables/use-cache'
export type { UseCacheStateOptions, UseCacheStateReturn } from '../composables/use-cache-state'
export type { UseCacheQueryOptions, UseCacheQueryReturn } from '../composables/use-cache-query'
export type { UseSWROptions, UseSWRReturn } from '../composables/use-swr'

export type { VCacheBinding } from '../directives/v-cache'
export type { CacheableOptions } from '../decorators/cacheable'
