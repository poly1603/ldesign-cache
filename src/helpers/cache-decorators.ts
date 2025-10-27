/**
 * 缓存装饰器
 * 
 * 提供TypeScript装饰器，用于自动缓存类方法的返回值
 * 
 * @example
 * ```typescript
 * class UserService {
 *   @Cached({ ttl: 5 * 60 * 1000 })
 *   async getUser(id: string): Promise<User> {
 *     return await fetchUserFromAPI(id)
 *   }
 *   
 *   @CachedProperty()
 *   get config() {
 *     return this.expensiveComputation()
 *   }
 * }
 * ```
 */

import type { SetOptions } from '../types'
import { getDefaultCache } from '../index'

/**
 * 缓存装饰器配置
 */
export interface CachedDecoratorOptions extends SetOptions {
  /** 缓存键生成器（可选，默认使用类名+方法名+参数） */
  keyGenerator?: (...args: any[]) => string

  /** 是否缓存null/undefined结果 */
  cacheNullable?: boolean

  /** 是否在出错时返回缓存值（降级） */
  fallbackToCache?: boolean
}

/**
 * 方法缓存装饰器
 * 
 * 自动缓存方法的返回值，基于方法参数生成缓存键
 * 
 * @param options - 缓存选项
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * class DataService {
 *   @Cached({ ttl: 5 * 60 * 1000 }) // 5分钟缓存
 *   async fetchData(id: string): Promise<Data> {
 *     return await api.get(`/data/${id}`)
 *   }
 *   
 *   @Cached({
 *     ttl: 10 * 60 * 1000,
 *     keyGenerator: (userId, filter) => `user:${userId}:filter:${filter.type}`
 *   })
 *   async getUserData(userId: string, filter: Filter): Promise<UserData> {
 *     return await api.get(`/users/${userId}`, filter)
 *   }
 * }
 * ```
 */
export function Cached(options?: CachedDecoratorOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    if (typeof originalMethod !== 'function') {
      throw new Error('@Cached can only be applied to methods')
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      const cache = getDefaultCache()

      // 生成缓存键
      let cacheKey: string
      if (options?.keyGenerator) {
        cacheKey = options.keyGenerator(...args)
      }
      else {
        const className = target.constructor?.name || 'unknown'
        const argsKey = args.length > 0 ? `:${JSON.stringify(args)}` : ''
        cacheKey = `${className}.${propertyKey}${argsKey}`
      }

      // 尝试从缓存获取
      try {
        const cached = await cache.get(cacheKey)
        if (cached !== null || options?.cacheNullable) {
          return cached
        }
      }
      catch (error) {
        if (!options?.fallbackToCache) {
          console.warn(`[Cached] Failed to get cache for ${cacheKey}:`, error)
        }
      }

      // 执行原方法
      try {
        const result = await originalMethod.apply(this, args)

        // 缓存结果（除非是null/undefined且不缓存空值）
        if (result !== null && result !== undefined || options?.cacheNullable) {
          try {
            await cache.set(cacheKey, result, {
              ttl: options?.ttl,
              engine: options?.engine,
              encrypt: options?.encrypt,
            })
          }
          catch (error) {
            console.warn(`[Cached] Failed to cache result for ${cacheKey}:`, error)
          }
        }

        return result
      }
      catch (error) {
        // 如果启用降级，尝试返回缓存值
        if (options?.fallbackToCache) {
          try {
            const cached = await cache.get(cacheKey)
            if (cached !== null) {
              console.warn(`[Cached] Using cached fallback for ${cacheKey} due to error:`, error)
              return cached
            }
          }
          catch {
            // 缓存也失败，继续抛出原错误
          }
        }

        throw error
      }
    }

    return descriptor
  }
}

/**
 * 属性缓存装饰器
 * 
 * 缓存getter的返回值，第一次访问时计算并缓存
 * 
 * @param options - 缓存选项
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * class ConfigService {
 *   @CachedProperty({ ttl: 60 * 1000 })
 *   get config(): Config {
 *     return this.loadConfig() // 只在第一次调用时执行
 *   }
 * }
 * ```
 */
export function CachedProperty(options?: CachedDecoratorOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalGetter = descriptor.get

    if (!originalGetter) {
      throw new Error('@CachedProperty can only be applied to getters')
    }

    descriptor.get = function (this: any) {
      const cache = getDefaultCache()
      const className = this.constructor?.name || 'unknown'
      const instanceId = (this as any).__cacheInstanceId__ || 'default'
      const cacheKey = `${className}.${instanceId}.${propertyKey}`

      // 同步获取缓存（使用内存引擎）
      // 注意：这里需要转为同步操作
      const cachedValue = (cache as any).__syncCache__?.get(cacheKey)
      if (cachedValue !== undefined) {
        return cachedValue
      }

      // 执行原getter
      const result = originalGetter.call(this)

      // 异步缓存结果
      cache.set(cacheKey, result, {
        ttl: options?.ttl,
        engine: 'memory', // 属性缓存使用内存引擎
      }).catch(error => {
        console.warn(`[CachedProperty] Failed to cache ${cacheKey}:`, error)
      })

      return result
    }

    return descriptor
  }
}

/**
 * 缓存清除装饰器
 * 
 * 在方法执行后清除指定的缓存
 * 
 * @param cacheKeys - 要清除的缓存键（或键生成函数）
 * @returns 装饰器函数
 * 
 * @example
 * ```typescript
 * class UserService {
 *   @Cached({ ttl: 5 * 60 * 1000 })
 *   async getUser(id: string): Promise<User> {
 *     return await api.get(`/users/${id}`)
 *   }
 *   
 *   @CacheEvict(['UserService.getUser*'])
 *   async updateUser(id: string, data: Partial<User>): Promise<User> {
 *     return await api.put(`/users/${id}`, data)
 *   }
 * }
 * ```
 */
export function CacheEvict(
  cacheKeys: string[] | ((...args: any[]) => string[]),
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    if (typeof originalMethod !== 'function') {
      throw new Error('@CacheEvict can only be applied to methods')
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 清除缓存
      const cache = getDefaultCache()
      const keys = typeof cacheKeys === 'function'
        ? cacheKeys(...args)
        : cacheKeys

      for (const key of keys) {
        // 支持通配符
        if (key.includes('*')) {
          const pattern = new RegExp(key.replace(/\*/g, '.*'))
          const allKeys = await cache.keys()

          for (const k of allKeys) {
            if (pattern.test(k)) {
              await cache.remove(k).catch(console.warn)
            }
          }
        }
        else {
          await cache.remove(key).catch(console.warn)
        }
      }

      return result
    }

    return descriptor
  }
}

/**
 * 缓存更新装饰器
 * 
 * 在方法执行后更新指定的缓存
 * 
 * @param keyGenerator - 缓存键生成函数
 * @param options - 缓存选项
 * @returns 装饰器函数
 */
export function CacheUpdate(
  keyGenerator: (...args: any[]) => string,
  options?: SetOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    if (typeof originalMethod !== 'function') {
      throw new Error('@CacheUpdate can only be applied to methods')
    }

    descriptor.value = async function (this: any, ...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 更新缓存
      const cache = getDefaultCache()
      const cacheKey = keyGenerator(...args)

      await cache.set(cacheKey, result, options).catch(error => {
        console.warn(`[CacheUpdate] Failed to update cache ${cacheKey}:`, error)
      })

      return result
    }

    return descriptor
  }
}

