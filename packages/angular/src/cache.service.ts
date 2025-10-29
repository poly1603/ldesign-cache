/**
 * Angular Cache Service
 */
import { Injectable } from '@angular/core'
import { Observable, from } from 'rxjs'
import { createCache, type CacheManager, type SetOptions, type SerializableValue } from '@ldesign/cache-core'
import type { CacheServiceConfig } from './types'

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cacheManager: CacheManager

  constructor() {
    this.cacheManager = createCache()
  }

  configure(config: CacheServiceConfig) {
    this.cacheManager = createCache(config)
  }

  get<T extends SerializableValue = SerializableValue>(key: string): Observable<T | null> {
    return from(this.cacheManager.get<T>(key))
  }

  set<T extends SerializableValue = SerializableValue>(
    key: string,
    value: T,
    options?: SetOptions,
  ): Observable<void> {
    return from(this.cacheManager.set(key, value, options))
  }

  remove(key: string): Observable<void> {
    return from(this.cacheManager.remove(key))
  }

  clear(): Observable<void> {
    return from(this.cacheManager.clear())
  }

  has(key: string): Observable<boolean> {
    return from(this.cacheManager.has(key))
  }

  keys(): Observable<string[]> {
    return from(this.cacheManager.keys())
  }

  remember<T extends SerializableValue = SerializableValue>(
    key: string,
    fetcher: () => Promise<T> | T,
    options?: SetOptions,
  ): Observable<T> {
    return from(this.cacheManager.remember(key, fetcher, options))
  }
}

