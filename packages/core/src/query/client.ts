import type { CacheItem, CacheQueryClientLike, CacheQueryOptions, CacheQueryResult, SetOptions } from '../types'

interface QueryCacheAdapter {
  get<T = unknown>(key: string): T | undefined
  getItem<T = unknown>(key: string): CacheItem<T> | undefined
  set<T = unknown>(key: string, value: T, options?: number | SetOptions): void
}

const DEFAULT_RETRY_DELAY = 300

export class CacheQueryClient implements CacheQueryClientLike {
  private readonly inflight = new Map<string, Promise<CacheQueryResult<any>>>()

  constructor(private readonly cache: QueryCacheAdapter) {}

  async fetch<T = unknown>(options: CacheQueryOptions<T>): Promise<CacheQueryResult<T>> {
    const {
      key,
      fetcher,
      staleTime = 0,
      swr = false,
      dedupe = true,
      dedupeKey,
      force = false,
      retry = 0,
      retryDelay = DEFAULT_RETRY_DELAY,
      ttl,
      tags,
      namespace,
      priority,
    } = options

    const requestKey = dedupeKey ?? key

    if (!force) {
      const cachedItem = this.cache.getItem<T>(key)
      if (cachedItem) {
        const updatedAt = cachedItem.lastAccessedAt || cachedItem.createdAt
        const stale = staleTime > 0 ? (Date.now() - updatedAt) >= staleTime : false

        if (!stale) {
          return {
            data: cachedItem.value,
            fromCache: true,
            stale: false,
            updatedAt,
          }
        }

        if (swr) {
          void this.prefetch({ ...options, force: true, swr: false }).catch(() => {})
          return {
            data: cachedItem.value,
            fromCache: true,
            stale: true,
            updatedAt,
          }
        }
      }
    }

    if (dedupe) {
      const existing = this.inflight.get(requestKey)
      if (existing) {
        return existing
      }
    }

    const task = this.executeRequest<T>(
      key,
      fetcher,
      {
        retry,
        retryDelay,
        ttl,
        tags,
        namespace,
        priority,
      },
    )

    if (dedupe) {
      this.inflight.set(requestKey, task)
      task.finally(() => {
        const current = this.inflight.get(requestKey)
        if (current === task) {
          this.inflight.delete(requestKey)
        }
      })
    }

    return task
  }

  async prefetch<T = unknown>(options: CacheQueryOptions<T>): Promise<void> {
    await this.fetch({ ...options, force: true, swr: false })
  }

  async revalidate<T = unknown>(options: CacheQueryOptions<T>): Promise<CacheQueryResult<T>> {
    return this.fetch({ ...options, force: true, swr: false })
  }

  clearInflight(key?: string): void {
    if (!key) {
      this.inflight.clear()
      return
    }

    this.inflight.delete(key)
  }

  getInflightKeys(): string[] {
    return Array.from(this.inflight.keys())
  }

  private async executeRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      retry: number
      retryDelay: number
      ttl?: number
      tags?: string[]
      namespace?: string
      priority?: number
    },
  ): Promise<CacheQueryResult<T>> {
    const { retry, retryDelay, ttl, tags, namespace, priority } = options
    let attempt = 0

    for (;;) {
      try {
        const data = await fetcher()
        this.cache.set(key, data, {
          ttl,
          tags,
          namespace,
          priority,
        })

        const item = this.cache.getItem<T>(key)

        return {
          data,
          fromCache: false,
          stale: false,
          updatedAt: item?.lastAccessedAt || item?.createdAt || Date.now(),
        }
      }
      catch (error) {
        attempt++
        if (attempt > retry) {
          throw error
        }

        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }
}

export function createCacheQueryClient(cache: QueryCacheAdapter): CacheQueryClient {
  return new CacheQueryClient(cache)
}
