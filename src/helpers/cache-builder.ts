/**
 * 链式缓存构建器
 * 
 * 提供流畅的API来配置和创建缓存实例
 * 
 * @example
 * ```typescript
 * const cache = new CacheBuilder()
 *   .withEngine('indexedDB')
 *   .withTTL(24 * 60 * 60 * 1000)
 *   .withEncryption('my-secret-key')
 *   .withKeyPrefix('app')
 *   .enableDebug()
 *   .build()
 * ```
 */

import type { CacheOptions, StorageEngine } from '../types'
import { CacheManager } from '../core/cache-manager'

/**
 * 链式缓存构建器
 */
export class CacheBuilder {
  private options: Partial<CacheOptions> = {}

  /**
   * 设置默认存储引擎
   * 
   * @param engine - 存储引擎类型
   * @returns 构建器实例（支持链式调用）
   */
  withEngine(engine: StorageEngine): this {
    this.options.defaultEngine = engine
    return this
  }

  /**
   * 设置默认TTL
   * 
   * @param ttl - 过期时间（毫秒）
   * @returns 构建器实例
   */
  withTTL(ttl: number): this {
    this.options.defaultTTL = ttl
    return this
  }

  /**
   * 启用加密
   * 
   * @param secretKey - 加密密钥（可选）
   * @param algorithm - 加密算法（默认'AES'）
   * @returns 构建器实例
   */
  withEncryption(secretKey?: string, algorithm: 'AES' | 'DES' | 'custom' = 'AES'): this {
    this.options.security = {
      ...this.options.security,
      encryption: {
        enabled: true,
        secretKey,
        algorithm,
      },
    }
    return this
  }

  /**
   * 启用键名混淆
   * 
   * @param prefix - 混淆前缀（可选）
   * @param algorithm - 混淆算法（默认'hash'）
   * @returns 构建器实例
   */
  withObfuscation(
    prefix?: string,
    algorithm: 'hash' | 'base64' | 'custom' = 'hash',
  ): this {
    this.options.security = {
      ...this.options.security,
      obfuscation: {
        enabled: true,
        prefix,
        algorithm,
      },
    }
    return this
  }

  /**
   * 设置键前缀
   * 
   * @param prefix - 键前缀
   * @returns 构建器实例
   */
  withKeyPrefix(prefix: string): this {
    this.options.keyPrefix = prefix
    return this
  }

  /**
   * 启用调试模式
   * 
   * @returns 构建器实例
   */
  enableDebug(): this {
    this.options.debug = true
    return this
  }

  /**
   * 启用智能存储策略
   * 
   * @param config - 策略配置（可选）
   * @returns 构建器实例
   */
  withSmartStrategy(config?: {
    sizeThresholds?: { small: number, medium: number, large: number }
    ttlThresholds?: { short: number, medium: number, long: number }
  }): this {
    this.options.strategy = {
      enabled: true,
      ...config,
    }
    return this
  }

  /**
   * 设置最大内存限制
   * 
   * @param bytes - 内存限制（字节）
   * @returns 构建器实例
   */
  withMaxMemory(bytes: number): this {
    this.options.maxMemory = bytes
    return this
  }

  /**
   * 设置清理间隔
   * 
   * @param ms - 清理间隔（毫秒）
   * @returns 构建器实例
   */
  withCleanupInterval(ms: number): this {
    this.options.cleanupInterval = ms
    return this
  }

  /**
   * 启用预取
   * 
   * @param config - 预取配置（可选）
   * @returns 构建器实例
   */
  enablePrefetch(config?: {
    strategy?: 'markov' | 'lru' | 'association'
    fetcher?: (key: string) => Promise<any>
  }): this {
    this.options.enablePrefetch = true
    this.options.prefetch = config
    return this
  }

  /**
   * 配置引擎选项
   * 
   * @param engine - 引擎类型
   * @param config - 引擎配置
   * @returns 构建器实例
   */
  configureEngine(engine: StorageEngine, config: Record<string, unknown>): this {
    this.options.engines = {
      ...this.options.engines,
      [engine]: config,
    }
    return this
  }

  /**
   * 构建缓存实例
   * 
   * @returns 缓存管理器实例
   */
  build(): CacheManager {
    return new CacheManager(this.options)
  }

  /**
   * 获取当前配置（用于调试）
   * 
   * @returns 当前配置对象
   */
  getConfig(): Partial<CacheOptions> {
    return { ...this.options }
  }

  /**
   * 重置配置
   * 
   * @returns 构建器实例
   */
  reset(): this {
    this.options = {}
    return this
  }
}

/**
 * 创建缓存构建器
 * 
 * @returns 构建器实例
 */
export function createCacheBuilder(): CacheBuilder {
  return new CacheBuilder()
}

/**
 * 快速创建常用配置的缓存
 */
export class CachePresets {
  /**
   * 创建浏览器缓存（localStorage + memory）
   */
  static browser(): CacheManager {
    return new CacheBuilder()
      .withEngine('localStorage')
      .withTTL(24 * 60 * 60 * 1000) // 24小时
      .withSmartStrategy()
      .build()
  }

  /**
   * 创建会话缓存（sessionStorage + memory）
   */
  static session(): CacheManager {
    return new CacheBuilder()
      .withEngine('sessionStorage')
      .withTTL(60 * 60 * 1000) // 1小时
      .build()
  }

  /**
   * 创建内存缓存（仅memory）
   */
  static memory(): CacheManager {
    return new CacheBuilder()
      .withEngine('memory')
      .withMaxMemory(50 * 1024 * 1024) // 50MB
      .build()
  }

  /**
   * 创建安全缓存（加密 + 混淆）
   */
  static secure(secretKey?: string): CacheManager {
    return new CacheBuilder()
      .withEngine('localStorage')
      .withEncryption(secretKey)
      .withObfuscation()
      .build()
  }

  /**
   * 创建高性能缓存（memory + 智能策略）
   */
  static highPerformance(): CacheManager {
    return new CacheBuilder()
      .withEngine('memory')
      .withMaxMemory(100 * 1024 * 1024)
      .withSmartStrategy()
      .enablePrefetch({ strategy: 'markov' })
      .build()
  }

  /**
   * 创建大数据缓存（indexedDB）
   */
  static largeData(): CacheManager {
    return new CacheBuilder()
      .withEngine('indexedDB')
      .withTTL(7 * 24 * 60 * 60 * 1000) // 7天
      .configureEngine('indexedDB', {
        dbName: 'ldesign-cache',
        version: 1,
        storeName: 'cache-store',
      })
      .build()
  }
}

