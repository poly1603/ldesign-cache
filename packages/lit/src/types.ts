/**
 * Lit 集成类型定义
 */
import type { CacheManager } from '@ldesign/cache-core'
import type { LitElement } from 'lit'

/**
 * Cache Mixin 接口
 */
export interface CacheMixinInterface {
  /**
   * 缓存管理器实例
   */
  readonly cache: CacheManager

  /**
   * 初始化缓存
   */
  initCache(): void

  /**
   * 清理缓存
   */
  cleanupCache(): void
}

/**
 * Cache Controller 选项
 */
export interface CacheControllerOptions {
  /**
   * 缓存键前缀
   */
  keyPrefix?: string

  /**
   * 默认 TTL
   */
  defaultTTL?: number

  /**
   * 是否自动清理
   */
  autoCleanup?: boolean
}

/**
 * 可缓存的 Lit 元素
 */
export type CacheableLitElement = LitElement & CacheMixinInterface


