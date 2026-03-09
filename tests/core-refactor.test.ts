import { describe, expect, it, vi } from 'vitest'
import {
  CacheEventType,
  CacheManager,
  cacheEventKeys,
  cacheStateKeys,
  createCacheEnginePlugin,
} from '../packages/core/src'
import type { CachePlugin } from '../packages/core/src'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('cache-core refactor', () => {
  it('calls plugin hooks in full chain and isolates plugin errors', () => {
    const calls: string[] = []
    let handledErrors = 0

    const tracingPlugin: CachePlugin<string> = {
      name: 'trace',
      init() {
        calls.push('init')
      },
      beforeSet() {
        calls.push('beforeSet')
      },
      afterSet() {
        calls.push('afterSet')
      },
      beforeGet() {
        calls.push('beforeGet')
      },
      afterGet() {
        calls.push('afterGet')
      },
      beforeDelete() {
        calls.push('beforeDelete')
      },
      afterDelete() {
        calls.push('afterDelete')
      },
      beforeClear() {
        calls.push('beforeClear')
      },
      afterClear() {
        calls.push('afterClear')
      },
      destroy() {
        calls.push('destroy')
      },
    }

    const crashPlugin: CachePlugin<string> = {
      name: 'crash',
      beforeSet() {
        throw new Error('beforeSet crash')
      },
    }

    const cache = new CacheManager<string>({
      plugins: [tracingPlugin, crashPlugin],
      onError: () => {
        handledErrors += 1
      },
    })

    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
    expect(cache.delete('k')).toBe(true)
    cache.clear()
    cache.destroy()

    expect(calls).toEqual(expect.arrayContaining([
      'init',
      'beforeSet',
      'afterSet',
      'beforeGet',
      'afterGet',
      'beforeDelete',
      'afterDelete',
      'beforeClear',
      'afterClear',
      'destroy',
    ]))
    expect(handledErrors).toBeGreaterThan(0)
  })

  it('supports tag and namespace invalidation', () => {
    const cache = new CacheManager<string>()

    cache.set('post:1', 'a', { tags: ['post'], namespace: 'content' })
    cache.set('post:2', 'b', { tags: ['post'], namespace: 'content' })
    cache.set('user:1', 'c', { tags: ['user'], namespace: 'account' })

    expect(cache.invalidateByTag('post')).toBe(2)
    expect(cache.get('post:1')).toBeUndefined()
    expect(cache.get('post:2')).toBeUndefined()
    expect(cache.get('user:1')).toBe('c')

    expect(cache.invalidateByNamespace('account')).toBe(1)
    expect(cache.get('user:1')).toBeUndefined()
  })

  it('supports dedupe and swr in query client', async () => {
    const cache = new CacheManager<number>()
    let requestCount = 0

    const fetcher = async () => {
      requestCount += 1
      await delay(20)
      return 100
    }

    const [r1, r2, r3] = await Promise.all([
      cache.query.fetch({ key: 'q:dedupe', fetcher, dedupe: true }),
      cache.query.fetch({ key: 'q:dedupe', fetcher, dedupe: true }),
      cache.query.fetch({ key: 'q:dedupe', fetcher, dedupe: true }),
    ])

    expect(requestCount).toBe(1)
    expect(r1.data).toBe(100)
    expect(r2.data).toBe(100)
    expect(r3.data).toBe(100)

    cache.set('q:swr', 1)
    await delay(5)

    let swrRequestCount = 0
    const swrResult = await cache.query.fetch({
      key: 'q:swr',
      fetcher: async () => {
        swrRequestCount += 1
        await delay(10)
        return 2
      },
      staleTime: 1,
      swr: true,
    })

    expect(swrResult.data).toBe(1)
    expect(swrResult.stale).toBe(true)

    await delay(30)
    expect(swrRequestCount).toBe(1)
    expect(cache.get('q:swr')).toBe(2)
  })

  it('keeps stats and events consistent', async () => {
    const cache = new CacheManager<string>({ defaultTTL: 1000, enableStats: true })

    const events = {
      hit: 0,
      miss: 0,
      expire: 0,
    }

    cache.on(CacheEventType.HIT, () => { events.hit += 1 })
    cache.on(CacheEventType.MISS, () => { events.miss += 1 })
    cache.on(CacheEventType.EXPIRE, () => { events.expire += 1 })

    cache.set('session', 'ok', { ttl: 20 })

    expect(cache.get('session')).toBe('ok')
    expect(cache.get('missing')).toBeUndefined()

    await delay(30)
    expect(cache.get('session')).toBeUndefined()

    const stats = cache.getStats()
    expect(stats.hits).toBe(1)
    expect(stats.misses).toBe(2)
    expect(stats.expirations).toBeGreaterThanOrEqual(1)
    expect(events.hit).toBe(1)
    expect(events.miss).toBe(2)
    expect(events.expire).toBeGreaterThanOrEqual(1)
  })

  it('registers and cleans engine state/event/api on install and uninstall', async () => {
    const stateMap = new Map<string, unknown>()
    const apiMap = new Map<string, unknown>()
    const emitted: string[] = []

    const engine = {
      state: {
        set: (key: string, value: unknown) => stateMap.set(key, value),
        get: (key: string) => stateMap.get(key),
        delete: (key: string) => stateMap.delete(key),
      },
      events: {
        emit: (event: string) => emitted.push(event),
      },
      api: {
        register: (api: any) => apiMap.set(api.name, api),
        unregister: (name: string) => apiMap.delete(name),
      },
      logger: {
        info: vi.fn(),
      },
    }

    const plugin = createCacheEnginePlugin({ maxSize: 8 })

    await plugin.install({ engine } as any)

    expect(stateMap.has(cacheStateKeys.MANAGER)).toBe(true)
    expect(stateMap.has(cacheStateKeys.CONTEXT)).toBe(true)
    expect(apiMap.has('cache')).toBe(true)
    expect(emitted).toContain(cacheEventKeys.INSTALLED)

    const api = apiMap.get('cache') as any
    api.set('engine:key', 'ok')
    expect(api.get('engine:key')).toBe('ok')

    await plugin.uninstall?.({ engine } as any)

    expect(stateMap.has(cacheStateKeys.MANAGER)).toBe(false)
    expect(stateMap.has(cacheStateKeys.CONTEXT)).toBe(false)
    expect(apiMap.has('cache')).toBe(false)
    expect(emitted).toContain(cacheEventKeys.UNINSTALLED)
  })
})
