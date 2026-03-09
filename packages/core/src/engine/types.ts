import type { CacheManager } from '../cache-manager'
import type { CacheOptions } from '../types'

export interface EngineLike {
  logger?: {
    info?: (...args: any[]) => void
    warn?: (...args: any[]) => void
    error?: (...args: any[]) => void
  }
  state?: {
    set?: (key: string, value: any) => void
    get?: (key: string) => any
    delete?: (key: string) => boolean | void
  }
  events?: {
    emit?: (event: string, payload?: any) => void
    on?: (event: string, handler: (payload?: any) => void) => void
    off?: (event: string, handler?: (payload?: any) => void) => void
    once?: (event: string, handler: (payload?: any) => void) => void
  }
  api?: {
    register?: (api: any) => void
    unregister?: (name: string) => boolean | void
  }
}

export interface CacheEnginePluginOptions extends CacheOptions<any> {
  name?: string
  version?: string
  dependencies?: string[]
  manager?: CacheManager<any>
  registerApi?: boolean
}

export interface CacheEnginePluginContext {
  engine: EngineLike
  manager: CacheManager<any>
  options: CacheEnginePluginOptions
}

export interface CacheEnginePluginApi {
  name: 'cache'
  version: string
  getInstance: () => CacheManager<any> | null
  getContext: () => CacheEnginePluginContext | null
  get: <T = unknown>(key: string) => T | undefined
  set: <T = unknown>(key: string, value: T, options?: number | { ttl?: number, tags?: string[], namespace?: string, priority?: number }) => void
  delete: (key: string) => boolean
  clear: () => void
  invalidateByTag: (tag: string) => number
  invalidateByNamespace: (namespace: string) => number
  query: CacheManager<any>['query']
}
