/**
 * 缓存事件相关类型定义
 * @module @ldesign/cache/core/types/event
 */

/**
 * 缓存事件类型
 */
export enum CacheEventType {
  /** 设置缓存项 */
  SET = 'set',
  /** 获取缓存项 */
  GET = 'get',
  /** 删除缓存项 */
  DELETE = 'delete',
  /** 清空缓存 */
  CLEAR = 'clear',
  /** 缓存项过期 */
  EXPIRE = 'expire',
  /** 缓存项被淘汰 */
  EVICT = 'evict',
  /** 缓存命中 */
  HIT = 'hit',
  /** 缓存未命中 */
  MISS = 'miss',
}

/**
 * 缓存事件数据
 */
export interface CacheEvent<T = any> {
  /** 事件类型 */
  type: CacheEventType
  /** 相关的键 */
  key?: string
  /** 相关的值 */
  value?: T
  /** 事件时间戳 */
  timestamp: number
  /** 额外的元数据 */
  metadata?: Record<string, any>
}

/**
 * 缓存事件监听器
 */
export type CacheEventListener<T = any> = (event: CacheEvent<T>) => void

