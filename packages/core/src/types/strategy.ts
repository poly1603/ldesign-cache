/**
 * 缓存策略相关类型定义
 * @module @ldesign/cache/core/types/strategy
 */

import type { CacheItem } from './cache'

/**
 * 缓存策略接口
 * @template T - 缓存值的类型
 */
export interface ICacheStrategy<T = any> {
  /** 当前缓存项数量 */
  readonly size: number
  
  /**
   * 获取缓存项
   * @param key - 缓存键
   * @returns 缓存值，不存在或已过期返回 undefined
   */
  get(key: string): T | undefined
  
  /**
   * 设置缓存项
   * @param key - 缓存键
   * @param value - 缓存值
   * @param ttl - 过期时间（毫秒），可选
   */
  set(key: string, value: T, ttl?: number): void
  
  /**
   * 删除缓存项
   * @param key - 缓存键
   * @returns 是否删除成功
   */
  delete(key: string): boolean
  
  /**
   * 检查缓存项是否存在
   * @param key - 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean
  
  /**
   * 清空所有缓存
   */
  clear(): void
  
  /**
   * 清理过期项
   * @returns 清理的项数
   */
  cleanup(): number
  
  /**
   * 获取缓存项详情
   * @param key - 缓存键
   * @returns 缓存项详情，不存在返回 undefined
   */
  getItem(key: string): CacheItem<T> | undefined
  
  /**
   * 获取所有键
   * @returns 所有缓存键数组
   */
  keys(): string[]
  
  /**
   * 获取所有值
   * @returns 所有缓存值数组
   */
  values(): T[]
  
  /**
   * 获取所有键值对
   * @returns 所有键值对数组
   */
  entries(): Array<[string, T]>
}

