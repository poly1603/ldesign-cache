/**
 * Cache manager with strategy abstraction, plugin lifecycle, metadata index,
 * invalidation and query enhancements.
 */

import type {
  BatchOptions,
  BatchResult,
  CacheError,
  CacheEvent,
  CacheEventListener,
  CacheItem,
  CacheOptions,
  CachePlugin,
  CachePluginContext,
  CacheStats,
  EvictionReason,
  ICacheStrategy,
  InvalidatePredicate,
  SetOptions,
  StorageType,
} from './types'
import { CacheErrorCode, CacheEventType, CacheStrategy } from './types'
import { FIFOCache } from './strategies/fifo'
import { LFUCache } from './strategies/lfu'
import { LRUCache } from './strategies/lru'
import { TTLCache } from './strategies/ttl'
import { CacheQueryClient } from './query/client'

interface InternalOptions<T> {
  strategy: CacheStrategy
  maxSize: number
  defaultTTL?: number
  enableStats: boolean
  enablePersistence: boolean
  storageType: StorageType
  storagePrefix: string
  cleanupInterval: number
  namespace?: string
  plugins: CachePlugin<T>[]
  onEvict?: (key: string, value: T, reason: EvictionReason) => void
  onExpire?: (key: string, value: T) => void
  onError?: (error: CacheError) => void
}

interface EntryMetadata {
  tags: string[]
  namespace?: string
  priority?: number
  ttl?: number
  expiresAt?: number
}

interface PersistedCacheEntry<T> {
  value: T
  ttl?: number
  expiresAt?: number
  tags?: string[]
  namespace?: string
  priority?: number
}

export class CacheManager<T = any> {
  readonly query: CacheQueryClient

  private strategy: ICacheStrategy<T>
  private options: InternalOptions<T>
  private listeners: Map<CacheEventType, Set<CacheEventListener<T>>>
  private stats: CacheStats
  private cleanupTimer?: ReturnType<typeof setInterval>

  private metadata = new Map<string, EntryMetadata>()
  private tagIndex = new Map<string, Set<string>>()
  private namespaceIndex = new Map<string, Set<string>>()

  constructor(options: CacheOptions<T> = {}) {
    this.options = {
      strategy: options.strategy ?? CacheStrategy.LRU,
      maxSize: options.maxSize ?? 100,
      defaultTTL: options.defaultTTL,
      enableStats: options.enableStats ?? true,
      enablePersistence: options.enablePersistence ?? false,
      storageType: options.storageType ?? 'localStorage',
      storagePrefix: options.storagePrefix ?? 'cache:',
      cleanupInterval: options.cleanupInterval ?? 60_000,
      namespace: options.namespace,
      plugins: [...(options.plugins ?? [])],
      onEvict: options.onEvict,
      onExpire: options.onExpire,
      onError: options.onError,
    }

    this.strategy = this.createStrategy(this.options.strategy)
    this.listeners = new Map()
    this.stats = {
      size: 0,
      maxSize: this.options.maxSize,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      expirations: 0,
      memoryUsage: 0,
      lastUpdated: Date.now(),
    }

    this.query = new CacheQueryClient(this)

    this.initPlugins()

    if (this.options.cleanupInterval > 0) {
      this.startAutoCleanup()
    }

    if (this.options.enablePersistence) {
      this.loadFromStorage()
    }
  }

  get(key: string): T | undefined {
    this.assertKey(key)

    this.ensureNotExpired(key)

    let resolvedKey = key
    for (const plugin of this.options.plugins) {
      if (!plugin.beforeGet) {
        continue
      }
      try {
        const maybeKey = plugin.beforeGet(resolvedKey)
        if (typeof maybeKey === 'string' && maybeKey.length > 0) {
          resolvedKey = maybeKey
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'beforeGet', error, resolvedKey)
      }
    }

    let value = this.strategy.get(resolvedKey)

    // Guard against strategy-level expiration and remove stale metadata.
    if (value === undefined && this.metadata.has(resolvedKey) && !this.strategy.has(resolvedKey)) {
      this.handleExpiredWithoutValue(resolvedKey)
    }

    for (const plugin of this.options.plugins) {
      if (!plugin.afterGet) {
        continue
      }
      try {
        const transformed = plugin.afterGet(resolvedKey, value)
        if (transformed !== undefined || value === undefined) {
          value = transformed as T | undefined
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'afterGet', error, resolvedKey)
      }
    }

    if (this.options.enableStats) {
      this.stats.totalRequests += 1
      if (value !== undefined) {
        this.stats.hits += 1
        this.emit(CacheEventType.HIT, { key: resolvedKey, value })
      }
      else {
        this.stats.misses += 1
        this.emit(CacheEventType.MISS, { key: resolvedKey })
      }
      this.updateHitRate()
      this.stats.lastUpdated = Date.now()
    }

    this.emit(CacheEventType.GET, {
      key: resolvedKey,
      value,
      metadata: {
        fromCache: value !== undefined,
      },
    })

    return value
  }

  set(key: string, value: T, ttl?: number): void
  set(key: string, value: T, options?: SetOptions): void
  set(key: string, value: T, ttlOrOptions?: number | SetOptions): void {
    this.assertKey(key)

    let setInput = {
      key,
      value,
      options: this.resolveSetOptions(ttlOrOptions),
    }

    for (const plugin of this.options.plugins) {
      if (!plugin.beforeSet) {
        continue
      }
      try {
        const transformed = plugin.beforeSet(setInput.key, setInput.value, setInput.options)
        if (transformed) {
          setInput = {
            key: transformed.key,
            value: transformed.value,
            options: this.resolveSetOptions(transformed.options),
          }
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'beforeSet', error, setInput.key)
      }
    }

    const { ttl: resolvedTTL } = setInput.options
    this.assertTTL(resolvedTTL)

    const evicted = (this.strategy as any).set(setInput.key, setInput.value, resolvedTTL) as CacheItem<T> | undefined

    this.setMetadata(setInput.key, setInput.options)

    if (evicted) {
      this.handleEviction(evicted)
    }

    if (this.options.enableStats) {
      this.stats.size = this.strategy.size
      this.updateMemoryUsage()
      this.stats.lastUpdated = Date.now()
    }

    this.emit(CacheEventType.SET, {
      key: setInput.key,
      value: setInput.value,
      metadata: {
        ttl: setInput.options.ttl,
        tags: setInput.options.tags,
        namespace: setInput.options.namespace,
        priority: setInput.options.priority,
      },
    })

    if (this.options.enablePersistence) {
      this.saveToStorage(setInput.key)
    }

    for (const plugin of this.options.plugins) {
      if (!plugin.afterSet) {
        continue
      }
      try {
        plugin.afterSet(setInput.key, setInput.value, setInput.options)
      }
      catch (error) {
        this.handlePluginError(plugin, 'afterSet', error, setInput.key)
      }
    }
  }

  delete(key: string): boolean {
    this.assertKey(key)

    let resolvedKey = key
    for (const plugin of this.options.plugins) {
      if (!plugin.beforeDelete) {
        continue
      }
      try {
        const maybeKey = plugin.beforeDelete(resolvedKey)
        if (typeof maybeKey === 'string' && maybeKey.length > 0) {
          resolvedKey = maybeKey
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'beforeDelete', error, resolvedKey)
      }
    }

    const success = this.deleteInternal(resolvedKey, 'manual', true)

    for (const plugin of this.options.plugins) {
      if (!plugin.afterDelete) {
        continue
      }
      try {
        plugin.afterDelete(resolvedKey, success, 'manual')
      }
      catch (error) {
        this.handlePluginError(plugin, 'afterDelete', error, resolvedKey)
      }
    }

    return success
  }

  has(key: string): boolean {
    this.assertKey(key)
    if (this.ensureNotExpired(key)) {
      return false
    }
    return this.strategy.has(key)
  }

  clear(): void {
    for (const plugin of this.options.plugins) {
      if (!plugin.beforeClear) {
        continue
      }
      try {
        plugin.beforeClear()
      }
      catch (error) {
        this.handlePluginError(plugin, 'beforeClear', error)
      }
    }

    this.strategy.clear()
    this.metadata.clear()
    this.tagIndex.clear()
    this.namespaceIndex.clear()

    if (this.options.enableStats) {
      this.stats.size = 0
      this.stats.memoryUsage = 0
      this.stats.lastUpdated = Date.now()
    }

    this.emit(CacheEventType.CLEAR, {})

    if (this.options.enablePersistence) {
      this.clearStorage()
    }

    for (const plugin of this.options.plugins) {
      if (!plugin.afterClear) {
        continue
      }
      try {
        plugin.afterClear()
      }
      catch (error) {
        this.handlePluginError(plugin, 'afterClear', error)
      }
    }
  }

  invalidateByTag(tag: string): number {
    const keys = Array.from(this.tagIndex.get(tag) ?? [])
    let removed = 0

    for (const key of keys) {
      if (this.delete(key)) {
        removed += 1
      }
    }

    return removed
  }

  invalidateByNamespace(namespace: string): number {
    const keys = Array.from(this.namespaceIndex.get(namespace) ?? [])
    let removed = 0

    for (const key of keys) {
      if (this.delete(key)) {
        removed += 1
      }
    }

    return removed
  }

  invalidateWhere(predicate: InvalidatePredicate<T>): number {
    const keys = this.keys()
    let removed = 0

    for (const key of keys) {
      const item = this.getItem(key)
      if (item && predicate(item)) {
        if (this.delete(key)) {
          removed += 1
        }
      }
    }

    return removed
  }

  get size(): number {
    this.cleanupExpiredKeys()
    return this.strategy.size
  }

  keys(): string[] {
    this.cleanupExpiredKeys()
    return this.strategy.keys()
  }

  values(): T[] {
    this.cleanupExpiredKeys()
    return this.strategy.values()
  }

  entries(): Array<[string, T]> {
    this.cleanupExpiredKeys()
    return this.strategy.entries()
  }

  getItem(key: string): CacheItem<T> | undefined {
    this.assertKey(key)

    if (this.ensureNotExpired(key)) {
      return undefined
    }

    const item = this.strategy.getItem(key)
    if (!item) {
      this.removeMetadata(key)
      return undefined
    }

    const metadata = this.metadata.get(key)

    return {
      ...item,
      tags: metadata?.tags,
      namespace: metadata?.namespace,
      priority: metadata?.priority,
      ttl: item.ttl ?? metadata?.ttl,
      expiresAt: item.expiresAt ?? metadata?.expiresAt,
    }
  }

  mget(keys: string[]): Map<string, T> {
    const result = new Map<string, T>()

    for (const key of keys) {
      const value = this.get(key)
      if (value !== undefined) {
        result.set(key, value)
      }
    }

    return result
  }

  mset(entries: Array<[string, T]>, options: BatchOptions = {}): BatchResult<void> {
    const startedAt = Date.now()
    const succeeded: string[] = []
    const failed: Array<{ key: string, error: Error }> = []

    const {
      continueOnError = true,
      ttl,
      tags,
      namespace,
      priority,
      onProgress,
    } = options

    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i]

      try {
        this.set(key, value, {
          ttl,
          tags,
          namespace,
          priority,
        })
        succeeded.push(key)
      }
      catch (error) {
        failed.push({ key, error: error as Error })
        if (!continueOnError) {
          break
        }
      }
      finally {
        onProgress?.(i + 1, entries.length, key)
      }
    }

    return {
      succeeded,
      failed,
      results: new Map(),
      duration: Date.now() - startedAt,
      get allSucceeded() { return failed.length === 0 },
    }
  }

  mdel(keys: string[], options: BatchOptions = {}): BatchResult<boolean> {
    const startedAt = Date.now()
    const succeeded: string[] = []
    const failed: Array<{ key: string, error: Error }> = []
    const results = new Map<string, boolean>()

    const {
      continueOnError = true,
      onProgress,
    } = options

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i]

      try {
        const success = this.delete(key)
        results.set(key, success)
        if (success) {
          succeeded.push(key)
        }
      }
      catch (error) {
        failed.push({ key, error: error as Error })
        if (!continueOnError) {
          break
        }
      }
      finally {
        onProgress?.(i + 1, keys.length, key)
      }
    }

    return {
      succeeded,
      failed,
      results,
      duration: Date.now() - startedAt,
      get allSucceeded() { return failed.length === 0 },
    }
  }

  getStats(): CacheStats {
    this.cleanupExpiredKeys()

    return {
      ...this.stats,
      size: this.strategy.size,
      maxSize: this.options.maxSize,
      lastUpdated: Date.now(),
    }
  }

  resetStats(): void {
    this.stats = {
      size: this.strategy.size,
      maxSize: this.options.maxSize,
      totalRequests: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
      expirations: 0,
      memoryUsage: this.stats.memoryUsage,
      lastUpdated: Date.now(),
    }
  }

  cleanup(): number {
    return this.cleanupExpiredKeys()
  }

  on(type: CacheEventType, listener: CacheEventListener<T>): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(listener)
  }

  off(type: CacheEventType, listener: CacheEventListener<T>): void {
    this.listeners.get(type)?.delete(listener)
  }

  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
  }

  destroy(): void {
    this.stopAutoCleanup()
    this.clear()
    this.listeners.clear()
    this.query.clearInflight()

    for (const plugin of this.options.plugins) {
      if (!plugin.destroy) {
        continue
      }
      try {
        const maybePromise = plugin.destroy()
        if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
          void (maybePromise as Promise<void>).catch(error => {
            this.handlePluginError(plugin, 'destroy', error)
          })
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'destroy', error)
      }
    }
  }

  private initPlugins(): void {
    const manager = this
    const context: CachePluginContext<T> = {
      getStats: () => this.getStats(),
      get size() {
        return manager.size
      },
      keys: () => this.keys(),
      has: (key: string) => this.has(key),
      get: (key: string) => this.get(key),
      delete: (key: string) => this.delete(key),
    }

    for (const plugin of this.options.plugins) {
      if (!plugin.init) {
        continue
      }

      try {
        const maybePromise = plugin.init(context)
        if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
          void (maybePromise as Promise<void>).catch(error => {
            this.handlePluginError(plugin, 'init', error)
          })
        }
      }
      catch (error) {
        this.handlePluginError(plugin, 'init', error)
      }
    }
  }

  private resolveSetOptions(input?: number | SetOptions): SetOptions {
    const base: SetOptions = typeof input === 'number' ? { ttl: input } : { ...(input ?? {}) }

    if (base.ttl === undefined) {
      base.ttl = this.options.defaultTTL
    }

    if (base.namespace === undefined) {
      base.namespace = this.options.namespace
    }

    if (base.tags) {
      base.tags = this.normalizeTags(base.tags)
    }

    return base
  }

  private normalizeTags(tags: string[]): string[] {
    const normalized = tags
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    return Array.from(new Set(normalized))
  }

  private setMetadata(key: string, options: SetOptions): void {
    this.removeMetadata(key)

    const ttl = options.ttl
    const expiresAt = ttl !== undefined ? Date.now() + ttl : undefined

    const metadata: EntryMetadata = {
      tags: this.normalizeTags(options.tags ?? []),
      namespace: options.namespace,
      priority: options.priority,
      ttl,
      expiresAt,
    }

    this.metadata.set(key, metadata)

    for (const tag of metadata.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }

    if (metadata.namespace) {
      if (!this.namespaceIndex.has(metadata.namespace)) {
        this.namespaceIndex.set(metadata.namespace, new Set())
      }
      this.namespaceIndex.get(metadata.namespace)!.add(key)
    }
  }

  private removeMetadata(key: string): void {
    const metadata = this.metadata.get(key)
    if (!metadata) {
      return
    }

    for (const tag of metadata.tags) {
      const keys = this.tagIndex.get(tag)
      if (!keys) {
        continue
      }
      keys.delete(key)
      if (keys.size === 0) {
        this.tagIndex.delete(tag)
      }
    }

    if (metadata.namespace) {
      const keys = this.namespaceIndex.get(metadata.namespace)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.namespaceIndex.delete(metadata.namespace)
        }
      }
    }

    this.metadata.delete(key)
  }

  private ensureNotExpired(key: string): boolean {
    const metadata = this.metadata.get(key)
    if (!metadata?.expiresAt) {
      return false
    }

    if (metadata.expiresAt > Date.now()) {
      return false
    }

    this.deleteInternal(key, 'expired', false)
    return true
  }

  private cleanupExpiredKeys(): number {
    const now = Date.now()
    let count = 0

    for (const [key, metadata] of this.metadata.entries()) {
      if (!metadata.expiresAt || metadata.expiresAt > now) {
        continue
      }

      const deleted = this.deleteInternal(key, 'expired', false)
      if (deleted) {
        count += 1
      }
      else {
        this.handleExpiredWithoutValue(key)
        count += 1
      }
    }

    if (count > 0 && this.options.enableStats) {
      this.stats.size = this.strategy.size
      this.updateMemoryUsage()
      this.stats.lastUpdated = Date.now()
    }

    return count
  }

  private handleExpiredWithoutValue(key: string): void {
    this.removeMetadata(key)
    this.removeFromStorage(key)

    if (this.options.enableStats) {
      this.stats.expirations += 1
      this.stats.size = this.strategy.size
      this.stats.lastUpdated = Date.now()
    }

    this.emit(CacheEventType.EXPIRE, { key })
  }

  private deleteInternal(key: string, reason: EvictionReason, emitDeleteEvent: boolean): boolean {
    const value = this.peekValue(key)
    const success = this.strategy.delete(key)

    if (!success) {
      this.removeMetadata(key)
      return false
    }

    this.removeMetadata(key)

    if (this.options.enableStats) {
      this.stats.size = this.strategy.size
      if (reason === 'expired') {
        this.stats.expirations += 1
      }
      this.updateMemoryUsage()
      this.stats.lastUpdated = Date.now()
    }

    if (emitDeleteEvent) {
      this.emit(CacheEventType.DELETE, {
        key,
        value,
        metadata: { reason },
      })
    }

    if (reason === 'expired') {
      this.emit(CacheEventType.EXPIRE, { key, value })
      if (value !== undefined) {
        this.options.onExpire?.(key, value)
      }
    }

    if (this.options.enablePersistence) {
      this.removeFromStorage(key)
    }

    return true
  }

  private handleEviction(evicted: CacheItem<T>): void {
    const reason = this.resolveEvictionReasonByStrategy()
    this.removeMetadata(evicted.key)

    if (this.options.enableStats) {
      this.stats.evictions += 1
      this.stats.size = this.strategy.size
      this.stats.lastUpdated = Date.now()
    }

    this.emit(CacheEventType.EVICT, {
      key: evicted.key,
      value: evicted.value,
      metadata: { reason },
    })

    this.options.onEvict?.(evicted.key, evicted.value, reason)

    if (this.options.enablePersistence) {
      this.removeFromStorage(evicted.key)
    }
  }

  private resolveEvictionReasonByStrategy(): EvictionReason {
    switch (this.options.strategy) {
      case CacheStrategy.LFU:
        return 'lfu'
      case CacheStrategy.FIFO:
        return 'fifo'
      case CacheStrategy.LRU:
        return 'lru'
      default:
        return 'strategy'
    }
  }

  private peekValue(key: string): T | undefined {
    for (const [entryKey, value] of this.strategy.entries()) {
      if (entryKey === key) {
        return value
      }
    }
    return undefined
  }

  private emit(type: CacheEventType, data: Partial<CacheEvent<T>>): void {
    const listeners = this.listeners.get(type)
    if (!listeners || listeners.size === 0) {
      return
    }

    const event: CacheEvent<T> = {
      type,
      timestamp: Date.now(),
      ...data,
    }

    for (const listener of listeners) {
      try {
        listener(event)
      }
      catch (error) {
        this.handleError(error)
      }
    }
  }

  private createStrategy(strategy: CacheStrategy): ICacheStrategy<T> {
    const { maxSize, defaultTTL, cleanupInterval } = this.options

    switch (strategy) {
      case CacheStrategy.LFU:
        return new LFUCache<T>(maxSize, defaultTTL)
      case CacheStrategy.FIFO:
        return new FIFOCache<T>(maxSize, defaultTTL)
      case CacheStrategy.TTL:
        return new TTLCache<T>(defaultTTL ?? 5 * 60 * 1000, cleanupInterval)
      case CacheStrategy.LRU:
      default:
        return new LRUCache<T>(maxSize, defaultTTL)
    }
  }

  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests === 0
      ? 0
      : this.stats.hits / this.stats.totalRequests
  }

  private updateMemoryUsage(): void {
    let total = 0

    for (const [key, value] of this.strategy.entries()) {
      total += this.estimateSize(key)
      total += this.estimateSize(value)
    }

    this.stats.memoryUsage = total
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2
    }
    catch {
      return 0
    }
  }

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.options.cleanupInterval)

    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref()
    }
  }

  private loadFromStorage(): void {
    const storage = this.getStorage()
    if (!storage) {
      return
    }

    const prefix = this.options.storagePrefix
    const storageKeys: string[] = []

    for (let i = 0; i < storage.length; i += 1) {
      const storageKey = storage.key(i)
      if (storageKey && storageKey.startsWith(prefix)) {
        storageKeys.push(storageKey)
      }
    }

    for (const storageKey of storageKeys) {
      try {
        const raw = storage.getItem(storageKey)
        if (!raw) {
          continue
        }

        const parsed = JSON.parse(raw) as PersistedCacheEntry<T>
        const key = storageKey.slice(prefix.length)

        if (parsed.expiresAt && parsed.expiresAt <= Date.now()) {
          storage.removeItem(storageKey)
          continue
        }

        const ttl = parsed.expiresAt
          ? Math.max(1, parsed.expiresAt - Date.now())
          : parsed.ttl

        this.set(key, parsed.value, {
          ttl,
          tags: parsed.tags,
          namespace: parsed.namespace,
          priority: parsed.priority,
        })
      }
      catch (error) {
        this.handleError(error)
        storage.removeItem(storageKey)
      }
    }
  }

  private saveToStorage(key: string): void {
    const storage = this.getStorage()
    if (!storage) {
      return
    }

    const item = this.getItem(key)
    const storageKey = this.options.storagePrefix + key

    if (!item) {
      storage.removeItem(storageKey)
      return
    }

    const payload: PersistedCacheEntry<T> = {
      value: item.value,
      ttl: item.ttl,
      expiresAt: item.expiresAt,
      tags: item.tags,
      namespace: item.namespace,
      priority: item.priority,
    }

    try {
      storage.setItem(storageKey, JSON.stringify(payload))
    }
    catch (error) {
      this.handleError(error, key)
    }
  }

  private removeFromStorage(key: string): void {
    const storage = this.getStorage()
    if (!storage) {
      return
    }

    try {
      storage.removeItem(this.options.storagePrefix + key)
    }
    catch (error) {
      this.handleError(error, key)
    }
  }

  private clearStorage(): void {
    const storage = this.getStorage()
    if (!storage) {
      return
    }

    const prefix = this.options.storagePrefix
    const keysToRemove: string[] = []

    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      try {
        storage.removeItem(key)
      }
      catch (error) {
        this.handleError(error)
      }
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      return this.options.storageType === 'sessionStorage'
        ? window.sessionStorage
        : window.localStorage
    }
    catch (error) {
      this.handleError(error)
      return null
    }
  }

  private assertKey(key: string): void {
    if (typeof key !== 'string' || key.trim().length === 0) {
      const error = this.createCacheError('Invalid cache key.', CacheErrorCode.INVALID_KEY, key)
      this.handleError(error, key)
      throw error
    }
  }

  private assertTTL(ttl?: number): void {
    if (ttl !== undefined && (typeof ttl !== 'number' || Number.isNaN(ttl) || ttl < 0)) {
      const error = this.createCacheError('Invalid ttl value.', CacheErrorCode.INVALID_TTL)
      this.handleError(error)
      throw error
    }
  }

  private createCacheError(message: string, code: CacheErrorCode, key?: string, cause?: Error): CacheError {
    const error = new Error(message) as CacheError
    error.name = 'CacheError'
    error.code = code
    error.key = key
    error.cause = cause
    return error
  }

  private handlePluginError(plugin: CachePlugin<T>, hook: string, error: unknown, key?: string): void {
    this.handleError(
      this.createCacheError(
        `Plugin "${plugin.name}" failed in hook "${hook}".`,
        CacheErrorCode.UNKNOWN_ERROR,
        key,
        error as Error,
      ),
      key,
    )
  }

  private handleError(error: unknown, key?: string): void {
    const cacheError = error instanceof Error
      ? (error as CacheError)
      : this.createCacheError('Unknown cache error.', CacheErrorCode.UNKNOWN_ERROR, key)

    if (!cacheError.code) {
      cacheError.code = CacheErrorCode.UNKNOWN_ERROR
    }

    this.options.onError?.(cacheError)

    if (!this.options.onError) {
      // Keep a visible fallback if the consumer does not handle errors.
      console.error(cacheError)
    }
  }
}

export function createCacheManager<T = any>(options?: CacheOptions<T>): CacheManager<T> {
  return new CacheManager<T>(options)
}
