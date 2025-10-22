/**
 * 优化效果基准测试
 * 
 * 验证各项优化的性能提升
 */

import { describe, bench } from 'vitest'
import { CacheManager } from '../src/core/cache-manager'
import { LRUCache } from '../src/utils/lru-cache'
import { DeltaSync } from '../src/utils/delta-sync'

describe('LRU Cache Performance', () => {
  bench('LRU get (100 items)', () => {
    const lru = new LRUCache({ maxSize: 100 })

    // 预填充
    for (let i = 0; i < 100; i++) {
      lru.set(`key${i}`, `value${i}`)
    }

    // 基准测试
    for (let i = 0; i < 100; i++) {
      lru.get(`key${i}`)
    }
  })

  bench('LRU set (100 items)', () => {
    const lru = new LRUCache({ maxSize: 100 })

    for (let i = 0; i < 100; i++) {
      lru.set(`key${i}`, `value${i}`)
    }
  })

  bench('LRU with TTL cleanup', () => {
    const lru = new LRUCache({ maxSize: 100, defaultTTL: 1000 })

    for (let i = 0; i < 100; i++) {
      lru.set(`key${i}`, `value${i}`)
    }

    lru.cleanup()
  })
})

describe('Serialization Performance', () => {
  const cache = new CacheManager()

  bench('Simple string (optimized path)', async () => {
    await cache.set('test', 'simple string value')
  })

  bench('Simple number (optimized path)', async () => {
    await cache.set('test', 12345)
  })

  bench('Simple boolean (optimized path)', async () => {
    await cache.set('test', true)
  })

  bench('Complex object (JSON path)', async () => {
    await cache.set('test', {
      name: 'John',
      age: 30,
      preferences: ['coding', 'reading'],
    })
  })
})

describe('Batch Operations Performance', () => {
  const cache = new CacheManager()

  bench('mset - 10 items', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`,
    }))

    await cache.mset(items)
  })

  bench('mset - 100 items', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      key: `key${i}`,
      value: `value${i}`,
    }))

    await cache.mset(items)
  })

  bench('mget - 10 items', async () => {
    const keys = Array.from({ length: 10 }, (_, i) => `key${i}`)
    await cache.mget(keys)
  })

  bench('mget - 100 items', async () => {
    const keys = Array.from({ length: 100 }, (_, i) => `key${i}`)
    await cache.mget(keys)
  })
})

describe('Smart Routing Performance', () => {
  const cache = new CacheManager()

  bench('get with smart routing (cache hit)', async () => {
    // 预设数据
    await cache.set('cached-key', 'value')

    // 第二次获取会命中路由缓存
    await cache.get('cached-key')
  })

  bench('get without smart routing (first access)', async () => {
    // 首次访问，需要遍历引擎
    await cache.get('new-key')
  })
})

describe('Delta Sync Performance', () => {
  const smallObject = { name: 'John', age: 30 }
  const largeObject = {
    users: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      preferences: { theme: 'dark', lang: 'en' },
    })),
  }

  bench('Delta diff - small object', () => {
    const modified = { ...smallObject, age: 31 }
    DeltaSync.diff(smallObject, modified)
  })

  bench('Delta diff - large object', () => {
    const modified = { ...largeObject }
    modified.users[0].name = 'Modified User'
    DeltaSync.diff(largeObject, modified)
  })

  bench('Delta patch - small changes', () => {
    const delta = DeltaSync.diff(smallObject, { ...smallObject, age: 31 })
    DeltaSync.patch(smallObject, delta.changes)
  })

  bench('Delta shouldUseDelta check', () => {
    const modified = { ...largeObject }
    modified.users[0].name = 'Modified'
    DeltaSync.shouldUseDelta(largeObject, modified)
  })
})

describe('Event Throttling Performance', () => {
  const cache = new CacheManager()

  bench('High frequency events (1000 events)', async () => {
    // 模拟高频事件
    for (let i = 0; i < 1000; i++) {
      await cache.set(`key${i}`, `value${i}`)
    }
  })
})

describe('Memory Optimization', () => {
  const cache = new CacheManager()

  bench('optimizeMemory', async () => {
    // 填充一些数据
    for (let i = 0; i < 100; i++) {
      await cache.set(`key${i}`, `value${i}`)
    }

    // 优化内存
    await cache.optimizeMemory()
  })
})

describe('Comparison: Before vs After', () => {
  // 这些基准测试对比优化前后的性能

  describe('Serialization Cache', () => {
    bench('Old: Map + FIFO', () => {
      const cache = new Map<string, string>()
      const order: string[] = []
      const maxSize = 500

      for (let i = 0; i < 1000; i++) {
        const key = `key${i}`
        const value = `value${i}`

        cache.set(key, value)
        order.push(key)

        if (cache.size > maxSize) {
          const oldest = order.shift()
          if (oldest) cache.delete(oldest)
        }
      }
    })

    bench('New: LRU with TTL', () => {
      const lru = new LRUCache({ maxSize: 500, defaultTTL: 5000 })

      for (let i = 0; i < 1000; i++) {
        lru.set(`key${i}`, `value${i}`)
      }

      lru.cleanup()
    })
  })

  describe('Batch Operations', () => {
    const cache = new CacheManager()

    bench('Old: Sequential sets', async () => {
      for (let i = 0; i < 50; i++) {
        await cache.set(`key${i}`, `value${i}`)
      }
    })

    bench('New: Batch set', async () => {
      const items = Array.from({ length: 50 }, (_, i) => ({
        key: `key${i}`,
        value: `value${i}`,
      }))

      await cache.mset(items)
    })
  })
})

/**
 * 运行基准测试:
 * 
 * pnpm vitest run benchmark/optimizations.bench.ts
 * 
 * 或使用 UI:
 * pnpm vitest --ui benchmark/optimizations.bench.ts
 */

