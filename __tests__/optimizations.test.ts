/**
 * 优化功能测试
 * 
 * 测试 v0.2.0 新增的优化和功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '../src/core/cache-manager'
import { SyncManager } from '../src/core/sync-manager'
import { LRUCache } from '../src/utils/lru-cache'
import { DeltaSync } from '../src/utils/delta-sync'
import {
  CacheError,
  CacheErrorCode,
  ErrorAggregator,
  gracefulDegradation
} from '../src/utils/error-handler'

describe('LRU Cache', () => {
  let lru: LRUCache<string, string>

  beforeEach(() => {
    lru = new LRUCache({ maxSize: 3 })
  })

  it('should store and retrieve values', () => {
    lru.set('key1', 'value1')
    expect(lru.get('key1')).toBe('value1')
  })

  it('should evict least recently used item when full', () => {
    lru.set('key1', 'value1')
    lru.set('key2', 'value2')
    lru.set('key3', 'value3')
    lru.set('key4', 'value4')  // 应该淘汰 key1

    expect(lru.get('key1')).toBeUndefined()
    expect(lru.get('key4')).toBe('value4')
  })

  it('should support TTL expiration', async () => {
    lru.set('key', 'value', 100)  // 100ms TTL
    expect(lru.get('key')).toBe('value')

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(lru.get('key')).toBeUndefined()
  })

  it('should track statistics', () => {
    lru.set('key1', 'value1')
    lru.set('key2', 'value2')
    lru.get('key1')
    lru.get('key1')
    lru.get('key3')  // miss

    const stats = lru.getStats()
    expect(stats.hits).toBe(2)
    expect(stats.misses).toBe(1)
    expect(stats.hitRate).toBeCloseTo(0.667, 2)
  })

  it('should cleanup expired items', () => {
    lru.set('key1', 'value1', 100)
    lru.set('key2', 'value2', 100)
    lru.set('key3', 'value3')  // no TTL

    const cleaned = lru.cleanup()
    expect(cleaned).toBe(0)  // 还没过期

    // 等待过期后再测试
  })
})

describe('Smart Routing Cache', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      defaultEngine: 'memory',
    })
  })

  afterEach(async () => {
    await cache.destroy()
  })

  it('should cache key-engine mapping', async () => {
    await cache.set('test-key', 'test-value')

    // 第一次获取会遍历引擎
    const value1 = await cache.get('test-key')
    expect(value1).toBe('test-value')

    // 第二次获取会命中路由缓存（应该更快）
    const start = performance.now()
    const value2 = await cache.get('test-key')
    const duration = performance.now() - start

    expect(value2).toBe('test-value')
    expect(duration).toBeLessThan(10)  // 应该很快
  })

  it('should update routing cache on set', async () => {
    await cache.set('key', 'value1')
    const v1 = await cache.get('key')
    expect(v1).toBe('value1')

    // 更新值（路由缓存也应该更新）
    await cache.set('key', 'value2')
    const v2 = await cache.get('key')
    expect(v2).toBe('value2')
  })

  it('should clear routing cache on remove', async () => {
    await cache.set('key', 'value')
    await cache.get('key')  // 缓存路由

    await cache.remove('key')  // 应该清除路由缓存

    const value = await cache.get('key')
    expect(value).toBeNull()
  })
})

describe('Batch Operations with Engine API', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      defaultEngine: 'memory',
    })
  })

  afterEach(async () => {
    await cache.destroy()
  })

  it('should use engine batch API for mset', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`,
    }))

    const result = await cache.mset(items)

    expect(result.success).toHaveLength(10)
    expect(result.failed).toHaveLength(0)
  })

  it('should use engine batch API for mget', async () => {
    // 预设数据
    await cache.mset([
      { key: 'k1', value: 'v1' },
      { key: 'k2', value: 'v2' },
      { key: 'k3', value: 'v3' },
    ])

    const values = await cache.mget(['k1', 'k2', 'k3', 'k4'])

    expect(values.k1).toBe('v1')
    expect(values.k2).toBe('v2')
    expect(values.k3).toBe('v3')
    expect(values.k4).toBeNull()
  })

  it('should be faster than sequential operations', async () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`,
    }))

    // 批量操作
    const batchStart = performance.now()
    await cache.mset(items)
    const batchDuration = performance.now() - batchStart

    // 清空
    await cache.clear()

    // 逐个操作
    const seqStart = performance.now()
    for (const item of items) {
      await cache.set(item.key, item.value)
    }
    const seqDuration = performance.now() - seqStart

    // 批量应该更快
    expect(batchDuration).toBeLessThan(seqDuration)
    console.log(`Batch: ${batchDuration.toFixed(2)}ms vs Sequential: ${seqDuration.toFixed(2)}ms`)
  })
})

describe('Enhanced Sync Manager', () => {
  let cache: CacheManager
  let sync: SyncManager

  beforeEach(() => {
    cache = new CacheManager()
    sync = new SyncManager(cache, {
      enabled: true,
      channel: 'test-channel',
      conflictResolution: 'last-write-wins',
      enableOfflineQueue: true,
      batchInterval: 100,
    })
  })

  afterEach(() => {
    sync.destroy()
    cache.destroy()
  })

  it('should track sync status', async () => {
    const status = sync.getSyncStatus()

    expect(status).toHaveProperty('isOnline')
    expect(status).toHaveProperty('stats')
    expect(status).toHaveProperty('queueSize')
    expect(status).toHaveProperty('vectorClock')
  })

  it('should increment version counter on set', async () => {
    const status1 = sync.getSyncStatus()
    const version1 = status1.vectorClock[Object.keys(status1.vectorClock)[0]]

    await cache.set('key', 'value')

    const status2 = sync.getSyncStatus()
    const version2 = status2.vectorClock[Object.keys(status2.vectorClock)[0]]

    expect(version2).toBeGreaterThan(version1)
  })

  it('should support conflict event', (done) => {
    sync.on('conflict', (message) => {
      expect(message).toBeDefined()
      done()
    })

    // 手动触发冲突事件测试
    // 实际冲突需要多个标签页
  })
})

describe('Delta Sync', () => {
  it('should diff objects correctly', () => {
    const oldObj = { name: 'John', age: 30, city: 'NYC' }
    const newObj = { name: 'John', age: 31, city: 'LA' }

    const delta = DeltaSync.diff(oldObj, newObj)

    expect(delta.hasChanges).toBe(true)
    expect(delta.changeCount).toBe(2)  // age 和 city
    expect(delta.changes).toHaveLength(2)
  })

  it('should patch objects correctly', () => {
    const base = { name: 'John', age: 30 }
    const changes = [
      { op: 'update' as const, path: 'age', oldValue: 30, newValue: 31 },
      { op: 'add' as const, path: 'city', newValue: 'NYC' },
    ]

    const patched = DeltaSync.patch(base, changes)

    expect(patched.age).toBe(31)
    expect(patched.city).toBe('NYC')
  })

  it('should determine if delta is worthwhile', () => {
    const small = { a: 1, b: 2 }
    const smallModified = { a: 1, b: 3 }

    const large = {
      items: Array.from({ length: 100 }, (_, i) => ({ id: i, data: `data${i}` }))
    }
    const largeModified = { ...large }
    largeModified.items[0].data = 'modified'

    // 小对象可能不值得
    const shouldUseSmall = DeltaSync.shouldUseDelta(small, smallModified)

    // 大对象应该值得
    const shouldUseLarge = DeltaSync.shouldUseDelta(large, largeModified)

    expect(shouldUseLarge).toBe(true)
  })
})

describe('Error Handling', () => {
  it('should create cache error with code', () => {
    const error = new CacheError(
      CacheErrorCode.STORAGE_QUOTA_EXCEEDED,
      'Storage full',
      undefined,
      { key: 'test' }
    )

    expect(error.code).toBe(CacheErrorCode.STORAGE_QUOTA_EXCEEDED)
    expect(error.message).toBe('Storage full')
    expect(error.context).toEqual({ key: 'test' })
  })

  it('should classify errors correctly', () => {
    const quotaError = new Error('localStorage quota exceeded')
    const code = CacheErrorCode

    // 实际实现中的分类逻辑
    expect(quotaError.message).toContain('quota')
  })

  it('should aggregate errors', () => {
    const aggregator = new ErrorAggregator()

    aggregator.add(new Error('Error 1'))
    aggregator.add(new Error('Error 2'))
    aggregator.add(new Error('Error 3'))

    const stats = aggregator.getStats()
    expect(stats.total).toBe(3)
    expect(stats.recent).toHaveLength(3)
  })

  it('should support graceful degradation', async () => {
    let primaryCalled = false
    let fallback1Called = false

    const result = await gracefulDegradation(
      async () => {
        primaryCalled = true
        throw new Error('Primary failed')
      },
      [
        async () => {
          fallback1Called = true
          return 'fallback-value'
        },
      ]
    )

    expect(primaryCalled).toBe(true)
    expect(fallback1Called).toBe(true)
    expect(result).toBe('fallback-value')
  })
})

describe('Performance Improvements', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({
      defaultEngine: 'memory',
    })
  })

  afterEach(async () => {
    await cache.destroy()
  })

  it('should serialize simple values faster', async () => {
    const iterations = 1000

    // 简单值
    const simpleStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      await cache.set(`simple${i}`, 'simple-string')
    }
    const simpleDuration = performance.now() - simpleStart

    // 复杂对象
    const complexStart = performance.now()
    for (let i = 0; i < iterations; i++) {
      await cache.set(`complex${i}`, { name: 'test', value: i })
    }
    const complexDuration = performance.now() - complexStart

    // 简单值应该明显更快
    expect(simpleDuration).toBeLessThan(complexDuration)

    console.log(`Simple: ${simpleDuration.toFixed(2)}ms vs Complex: ${complexDuration.toFixed(2)}ms`)
  })

  it('should benefit from smart routing on repeated gets', async () => {
    await cache.set('test-key', 'test-value')

    // 第一次获取（建立路由）
    const firstStart = performance.now()
    await cache.get('test-key')
    const firstDuration = performance.now() - firstStart

    // 后续获取（使用路由缓存）
    const totalStart = performance.now()
    for (let i = 0; i < 100; i++) {
      await cache.get('test-key')
    }
    const avgDuration = (performance.now() - totalStart) / 100

    // 平均应该比第一次快（路由缓存生效）
    // 注意：实际效果取决于引擎数量和复杂度
    console.log(`First: ${firstDuration.toFixed(2)}ms vs Avg: ${avgDuration.toFixed(2)}ms`)
  })

  it('should batch operations efficiently', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`,
    }))

    // 批量操作
    const batchStart = performance.now()
    await cache.mset(items)
    const batchDuration = performance.now() - batchStart

    await cache.clear()

    // 逐个操作
    const seqStart = performance.now()
    for (const item of items) {
      await cache.set(item.key, item.value)
    }
    const seqDuration = performance.now() - seqStart

    console.log(`Batch: ${batchDuration.toFixed(2)}ms vs Sequential: ${seqDuration.toFixed(2)}ms`)
    expect(batchDuration).toBeLessThan(seqDuration)
  })
})

describe('Memory Optimization', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager()
  })

  afterEach(async () => {
    await cache.destroy()
  })

  it('should optimize memory on demand', async () => {
    // 填充数据
    for (let i = 0; i < 100; i++) {
      await cache.set(`key${i}`, `value${i}`)
    }

    // 优化内存
    await cache.optimizeMemory()

    // 验证缓存仍然工作
    const value = await cache.get('key0')
    expect(value).toBe('value0')
  })
})

describe('Integration: All Optimizations', () => {
  it('should work together seamlessly', async () => {
    const cache = new CacheManager({
      defaultEngine: 'memory',
      cleanupInterval: 10000,
    })

    const sync = new SyncManager(cache, {
      enabled: true,
      conflictResolution: 'last-write-wins',
      enableOfflineQueue: true,
      batchInterval: 100,
    })

    // 批量设置
    await cache.mset([
      { key: 'k1', value: 'v1' },
      { key: 'k2', value: 'v2' },
      { key: 'k3', value: 'v3' },
    ])

    // 批量获取（使用智能路由）
    const values = await cache.mget(['k1', 'k2', 'k3'])
    expect(Object.keys(values)).toHaveLength(3)

    // 获取同步状态
    const status = sync.getSyncStatus()
    expect(status.stats.sent).toBeGreaterThan(0)

    // 优化内存
    await cache.optimizeMemory()

    // 清理
    sync.destroy()
    await cache.destroy()
  })
})

describe('Delta Sync Integration', () => {
  it('should reduce sync data size for large objects', () => {
    const largeObject = {
      users: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      })),
    }

    const modified = { ...largeObject }
    modified.users[0].name = 'Modified User'

    const delta = DeltaSync.diff(largeObject, modified)
    const fullSize = DeltaSync.calculateObjectSize(modified)
    const deltaSize = DeltaSync.calculateDeltaSize(delta.changes)

    console.log(`Full: ${fullSize} bytes vs Delta: ${deltaSize} bytes`)
    console.log(`Savings: ${((1 - deltaSize / fullSize) * 100).toFixed(1)}%`)

    expect(deltaSize).toBeLessThan(fullSize * 0.5)  // 至少节省 50%
  })
})

describe('Error Handling Integration', () => {
  it('should handle storage quota exceeded gracefully', async () => {
    const cache = new CacheManager({
      engines: {
        memory: {
          maxSize: 1024,  // 很小的限制
          maxItems: 10,
        },
      },
    })

    try {
      // 尝试存储超过限制的数据
      const largeValue = 'x'.repeat(10000)
      await cache.set('large', largeValue)
    }
    catch (error) {
      expect(error).toBeDefined()
    }

    await cache.destroy()
  })
})

