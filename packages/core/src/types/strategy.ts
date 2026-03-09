/**
 * Cache strategy abstraction.
 */

import type { CacheItem } from './cache'

export interface ICacheStrategy<T = any> {
  readonly size: number

  get(key: string): T | undefined
  set(key: string, value: T, ttl?: number): void
  delete(key: string): boolean
  has(key: string): boolean
  clear(): void
  cleanup(): number
  getItem(key: string): CacheItem<T> | undefined
  keys(): string[]
  values(): T[]
  entries(): Array<[string, T]>
}
