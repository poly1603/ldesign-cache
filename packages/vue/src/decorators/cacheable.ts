/**
 * @Cacheable 装饰器
 * 
 * 用于方法级别的缓存
 * 
 * @module @ldesign/cache/vue/decorators/cacheable
 */

import type { CacheManager } from '@ldesign/cache/core'

/**
 * Cacheable 装饰器选项
 */
export interface CacheableOptions {
  /** 缓存管理器实例 */
  cache: CacheManager
  /** 缓存键生成函数，默认使用方法名和参数生成 */
  keyGenerator?: (...args: any[]) => string
  /** 缓存 TTL（毫秒） */
  ttl?: number
  /** 是否缓存 undefined 结果 */
  cacheUndefined?: boolean
  /** 是否缓存 null 结果 */
  cacheNull?: boolean
}

/**
 * 默认键生成器
 * @param methodName - 方法名
 * @param args - 方法参数
 * @returns 缓存键
 */
function defaultKeyGenerator(methodName: string, ...args: any[]): string {
  const argsKey = args.length > 0 ? `:${JSON.stringify(args)}` : ''
  return `${methodName}${argsKey}`
}

/**
 * @Cacheable 装饰器
 * 
 * 用于缓存方法的返回值
 * 
 * @param options - 装饰器选项
 * @returns 方法装饰器
 * 
 * @example
 * ```typescript
 * import { Cacheable } from '@ldesign/cache/vue'
 * import { createCacheManager } from '@ldesign/cache/core'
 * 
 * const cache = createCacheManager()
 * 
 * class UserService {
 *   @Cacheable({ cache, ttl: 60000 })
 *   async getUser(id: string) {
 *     const res = await fetch(`/api/users/${id}`)
 *     return res.json()
 *   }
 * 
 *   @Cacheable({
 *     cache,
 *     keyGenerator: (id: string) => `user:${id}`,
 *     ttl: 300000
 *   })
 *   async getUserProfile(id: string) {
 *     const res = await fetch(`/api/users/${id}/profile`)
 *     return res.json()
 *   }
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions) {
  const {
    cache,
    keyGenerator,
    ttl,
    cacheUndefined = false,
    cacheNull = false,
  } = options

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = keyGenerator
        ? keyGenerator(...args)
        : defaultKeyGenerator(propertyKey, ...args)

      // 尝试从缓存获取
      const cached = cache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 检查是否应该缓存结果
      const shouldCache
        = result !== undefined
        || (result === undefined && cacheUndefined)
        || (result === null && cacheNull)

      if (shouldCache) {
        cache.set(cacheKey, result, ttl)
      }

      return result
    }

    return descriptor
  }
}

/**
 * 创建 Cacheable 装饰器
 * @param cache - 缓存管理器实例
 * @returns Cacheable 装饰器工厂
 */
export function createCacheable(cache: CacheManager) {
  return function (options?: Omit<CacheableOptions, 'cache'>) {
    return Cacheable({ cache, ...options })
  }
}

