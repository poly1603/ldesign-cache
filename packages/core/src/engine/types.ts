export interface CacheEnginePluginOptions {
  dependencies?: string[]
  /** 最大缓存大小 */
  maxSize?: number
  /** 默认 TTL */
  defaultTTL?: number
}
