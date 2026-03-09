/**
 * Cache event types.
 */

export enum CacheEventType {
  SET = 'set',
  GET = 'get',
  DELETE = 'delete',
  CLEAR = 'clear',
  EXPIRE = 'expire',
  EVICT = 'evict',
  HIT = 'hit',
  MISS = 'miss',
}

export interface CacheEvent<T = any> {
  type: CacheEventType
  key?: string
  value?: T
  timestamp: number
  metadata?: Record<string, any>
}

export type CacheEventListener<T = any> = (event: CacheEvent<T>) => void
