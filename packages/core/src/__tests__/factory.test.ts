/**
 * Factory 函数测试
 */
import { describe, it, expect } from 'vitest'
import { createCache, getDefaultCache, cache } from '../factory'
import { CacheManager } from '../core/cache-manager'

describe('Factory Functions', () => {
  describe('createCache', () => {
    it('应该创建 CacheManager 实例', () => {
      const instance = createCache()
      expect(instance).toBeInstanceOf(CacheManager)
    })

    it('应该接受配置选项', () => {
      const instance = createCache({
        defaultEngine: 'localStorage',
        defaultTTL: 5000,
      })
      expect(instance).toBeInstanceOf(CacheManager)
    })

    it('应该支持 preset 选项', () => {
      const browserCache = createCache({ preset: 'browser' })
      const nodeCache = createCache({ preset: 'node' })

      expect(browserCache).toBeInstanceOf(CacheManager)
      expect(nodeCache).toBeInstanceOf(CacheManager)
    })
  })

  describe('getDefaultCache', () => {
    it('应该返回单例实例', () => {
      const instance1 = getDefaultCache()
      const instance2 = getDefaultCache()

      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(CacheManager)
    })
  })

  describe('cache 便捷 API', () => {
    it('应该提供 get 方法', async () => {
      expect(typeof cache.get).toBe('function')
      const value = await cache.get('test-key')
      expect(value).toBeDefined()
    })

    it('应该提供 set 方法', async () => {
      expect(typeof cache.set).toBe('function')
      await cache.set('test-key', 'test-value')
    })

    it('应该提供 remove 方法', async () => {
      expect(typeof cache.remove).toBe('function')
      await cache.remove('test-key')
    })

    it('应该提供 clear 方法', async () => {
      expect(typeof cache.clear).toBe('function')
      await cache.clear()
    })

    it('应该提供 has 方法', async () => {
      expect(typeof cache.has).toBe('function')
      const exists = await cache.has('test-key')
      expect(typeof exists).toBe('boolean')
    })

    it('应该提供 keys 方法', async () => {
      expect(typeof cache.keys).toBe('function')
      const keys = await cache.keys()
      expect(Array.isArray(keys)).toBe(true)
    })

    it('应该提供 getStats 方法', async () => {
      expect(typeof cache.getStats).toBe('function')
      const stats = await cache.getStats()
      expect(stats).toHaveProperty('totalKeys')
    })

    it('应该提供 remember 方法', async () => {
      expect(typeof cache.remember).toBe('function')
      const value = await cache.remember('key', () => 'value')
      expect(value).toBe('value')
    })

    it('应该提供 manager 方法', () => {
      expect(typeof cache.manager).toBe('function')
      const manager = cache.manager()
      expect(manager).toBeInstanceOf(CacheManager)
    })
  })
})

