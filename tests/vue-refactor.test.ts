import { afterEach, describe, expect, it, vi } from 'vitest'
import * as vue from 'vue'
import { CacheManager } from '../packages/core/src'
import {
  CACHE_INJECTION_KEY,
  CachePlugin,
  createCacheEnginePlugin,
  useCache,
  useCacheQuery,
  useSWR,
} from '../packages/vue/src'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('cache-vue refactor', () => {
  it('native plugin injects provide/globalProperties and cleans owned manager on unmount', () => {
    const app = {
      config: { globalProperties: {} as Record<string, unknown> },
      provide: vi.fn(),
      directive: vi.fn(),
      component: vi.fn(),
      unmount: vi.fn(),
    }

    CachePlugin.install(app as any, {
      globalPropertyName: '$cache',
      maxSize: 20,
    })

    expect(app.provide).toHaveBeenCalledWith(CACHE_INJECTION_KEY, expect.any(CacheManager))
    const manager = app.provide.mock.calls[0][1] as CacheManager<string>

    expect(app.config.globalProperties.$cache).toBe(manager)

    manager.set('k', 'v')
    expect(manager.get('k')).toBe('v')

    app.unmount()
    expect(manager.size).toBe(0)
  })

  it('engine plugin supports immediate and deferred app installation paths', async () => {
    const makeEngine = () => {
      const state = new Map<string, unknown>()
      const apis = new Map<string, unknown>()

      return {
        state: {
          set: (k: string, v: unknown) => state.set(k, v),
          get: (k: string) => state.get(k),
          delete: (k: string) => state.delete(k),
        },
        events: {
          emit: vi.fn(),
          once: vi.fn(),
        },
        api: {
          register: (api: any) => apis.set(api.name, api),
          unregister: (name: string) => apis.delete(name),
        },
        logger: { info: vi.fn() },
        getApp: vi.fn(),
        _state: state,
        _apis: apis,
      }
    }

    const immediateApp = { use: vi.fn() }
    const engineImmediate = makeEngine()
    engineImmediate.getApp.mockReturnValue(immediateApp)

    const pluginImmediate = createCacheEnginePlugin({ maxSize: 8 })
    await pluginImmediate.install({ engine: engineImmediate } as any)

    expect(immediateApp.use).toHaveBeenCalledTimes(1)

    const deferredApp = { use: vi.fn() }
    const engineDeferred = makeEngine()
    engineDeferred.getApp.mockReturnValue(undefined)

    let appCreatedHandler: (() => void) | null = null
    ;(engineDeferred.events.once as any).mockImplementation((_event: string, cb: () => void) => {
      appCreatedHandler = cb
    })

    const pluginDeferred = createCacheEnginePlugin({ maxSize: 8 })
    await pluginDeferred.install({ engine: engineDeferred } as any)

    expect(deferredApp.use).toHaveBeenCalledTimes(0)

    engineDeferred.getApp.mockReturnValue(deferredApp)
    appCreatedHandler?.()

    expect(deferredApp.use).toHaveBeenCalledTimes(1)
  })

  it('useCache prioritizes injected instance and only destroys local instance', () => {
    const injected = new CacheManager<string>()
    const localUnmountCallbacks: Array<() => void> = []

    vi.spyOn(vue, 'getCurrentInstance').mockReturnValue({} as any)
    vi.spyOn(vue, 'inject').mockReturnValue(injected as any)
    vi.spyOn(vue, 'onUnmounted').mockImplementation((cb: any) => {
      localUnmountCallbacks.push(cb)
    })

    const injectedResult = useCache<string>({ autoCleanup: true })
    injected.set('keep', 'ok')

    expect(injectedResult.cache).toBe(injected)
    expect(injectedResult.source.value).toBe('injected')

    localUnmountCallbacks.forEach(cb => cb())
    expect(injected.get('keep')).toBe('ok')

    const localCallbacks: Array<() => void> = []
    vi.restoreAllMocks()

    vi.spyOn(vue, 'getCurrentInstance').mockReturnValue({} as any)
    vi.spyOn(vue, 'inject').mockReturnValue(null)
    vi.spyOn(vue, 'onUnmounted').mockImplementation((cb: any) => {
      localCallbacks.push(cb)
    })

    const localResult = useCache<string>({ autoCleanup: true })
    localResult.set('temp', '1')
    expect(localResult.get('temp')).toBe('1')

    localCallbacks.forEach(cb => cb())
    expect(localResult.cache.size).toBe(0)
  })

  it('useCacheQuery/useSWR wrap core query client behavior', async () => {
    const cache = new CacheManager<number | { v: number }>()
    let queryCount = 0

    const query = useCacheQuery<number>({
      cache,
      key: 'query:key',
      queryFn: async () => {
        queryCount += 1
        return 10
      },
      dedupe: true,
      immediate: false,
    })

    await Promise.all([query.execute(), query.execute(), query.execute()])

    expect(queryCount).toBe(1)
    expect(query.data.value).toBe(10)

    await query.refetch()
    expect(queryCount).toBe(2)

    let swrCount = 0
    const swr = useSWR<{ v: number }>({
      cache: cache as any,
      key: 'swr:key',
      fetcher: async () => {
        swrCount += 1
        return { v: swrCount }
      },
      immediate: false,
    })

    await swr.revalidate()
    expect(swr.data.value).toEqual({ v: 1 })

    await swr.mutate({ v: 9 })
    expect(cache.get('swr:key')).toEqual({ v: 9 })
  })
})
