/**
 * @Cacheable decorator.
 */

import type { CacheManager } from '@ldesign/cache-core'

export interface CacheableOptions {
  cache: CacheManager
  keyGenerator?: (...args: any[]) => string
  ttl?: number
  tags?: string[]
  namespace?: string
  priority?: number
  cacheUndefined?: boolean
  cacheNull?: boolean
}

function defaultKeyGenerator(methodName: string, ...args: any[]): string {
  const argsKey = args.length > 0 ? `:${JSON.stringify(args)}` : ''
  return `${methodName}${argsKey}`
}

export function Cacheable(options: CacheableOptions) {
  const {
    cache,
    keyGenerator,
    ttl,
    tags,
    namespace,
    priority,
    cacheUndefined = false,
    cacheNull = false,
  } = options

  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : defaultKeyGenerator(propertyKey, ...args)

      const cached = cache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      const result = await originalMethod.apply(this, args)

      const shouldCache
        = result !== undefined
        || (result === undefined && cacheUndefined)
        || (result === null && cacheNull)

      if (shouldCache) {
        cache.set(cacheKey, result, { ttl, tags, namespace, priority })
      }

      return result
    }

    return descriptor
  }
}

export function createCacheable(cache: CacheManager) {
  return function (options?: Omit<CacheableOptions, 'cache'>) {
    return Cacheable({ cache, ...options })
  }
}
