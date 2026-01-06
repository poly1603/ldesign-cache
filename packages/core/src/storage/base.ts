/**
 * 存储适配器基类
 * @module @ldesign/cache/core/storage/base
 */

import type { CacheItem, Serializer } from '../types'

// 内部使用的序列化器类型别名
type AnySerializer = Serializer<unknown>

/**
 * 存储适配器接口
 */
export interface IStorageAdapter {
  /**
   * 获取存储项
   * @param key - 键
   * @returns 缓存项，不存在返回 null
   */
  getItem<T>(key: string): Promise<CacheItem<T> | null> | CacheItem<T> | null

  /**
   * 设置存储项
   * @param key - 键
   * @param item - 缓存项
   */
  setItem<T>(key: string, item: CacheItem<T>): Promise<void> | void

  /**
   * 删除存储项
   * @param key - 键
   */
  removeItem(key: string): Promise<void> | void

  /**
   * 清空所有存储项
   */
  clear(): Promise<void> | void

  /**
   * 获取所有键
   * @returns 所有键数组
   */
  keys(): Promise<string[]> | string[]

  /**
   * 检查是否可用
   * @returns 是否可用
   */
  isAvailable(): boolean
}

/**
 * 存储适配器基类
 */
export abstract class BaseStorageAdapter implements IStorageAdapter {
  protected serializer: AnySerializer

  constructor(serializer: AnySerializer) {
    this.serializer = serializer
  }

  abstract getItem<T>(key: string): Promise<CacheItem<T> | null> | CacheItem<T> | null
  abstract setItem<T>(key: string, item: CacheItem<T>): Promise<void> | void
  abstract removeItem(key: string): Promise<void> | void
  abstract clear(): Promise<void> | void
  abstract keys(): Promise<string[]> | string[]
  abstract isAvailable(): boolean
}

