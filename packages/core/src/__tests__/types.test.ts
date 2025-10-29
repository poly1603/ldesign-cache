/**
 * 类型定义测试
 */
import { describe, it, expect } from 'vitest'
import type {
  SerializableValue,
  StorageEngine,
  CacheOptions,
  SetOptions,
  CacheStats,
  CacheItem,
  IStorageEngine,
} from '../types'

describe('Types', () => {
  it('应该正确定义 SerializableValue 类型', () => {
    const stringValue: SerializableValue = 'test'
    const numberValue: SerializableValue = 123
    const booleanValue: SerializableValue = true
    const nullValue: SerializableValue = null
    const arrayValue: SerializableValue = [1, 2, 3]
    const objectValue: SerializableValue = { key: 'value' }

    expect(typeof stringValue).toBe('string')
    expect(typeof numberValue).toBe('number')
    expect(typeof booleanValue).toBe('boolean')
    expect(nullValue).toBeNull()
    expect(Array.isArray(arrayValue)).toBe(true)
    expect(typeof objectValue).toBe('object')
  })

  it('应该正确定义 StorageEngine 类型', () => {
    const engines: StorageEngine[] = [
      'memory',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'cookie',
      'opfs',
    ]

    expect(engines).toHaveLength(6)
  })

  it('应该正确定义 CacheOptions 接口', () => {
    const options: CacheOptions = {
      defaultEngine: 'localStorage',
      defaultTTL: 60000,
      enablePerformanceTracking: true,
      security: {
        encryption: { enabled: true },
        obfuscation: { enabled: true },
      },
    }

    expect(options.defaultEngine).toBe('localStorage')
    expect(options.defaultTTL).toBe(60000)
  })

  it('应该正确定义 SetOptions 接口', () => {
    const options: SetOptions = {
      ttl: 5000,
      engine: 'memory',
      tags: ['user', 'profile'],
      priority: 1,
    }

    expect(options.ttl).toBe(5000)
    expect(options.tags).toHaveLength(2)
  })

  it('应该正确定义 CacheStats 接口', () => {
    const stats: CacheStats = {
      totalKeys: 10,
      hits: 8,
      misses: 2,
      hitRate: 0.8,
    }

    expect(stats.totalKeys).toBe(10)
    expect(stats.hitRate).toBe(0.8)
  })

  it('应该正确定义 CacheItem 接口', () => {
    const item: CacheItem<string> = {
      key: 'test-key',
      value: 'test-value',
      ttl: 60000,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      engine: 'memory',
    }

    expect(item.key).toBe('test-key')
    expect(item.value).toBe('test-value')
  })

  it('应该正确定义 IStorageEngine 接口', () => {
    const engine: IStorageEngine = {
      get: async (key: string) => null,
      set: async (key: string, value: any, options?: SetOptions) => { },
      remove: async (key: string) => { },
      clear: async () => { },
      has: async (key: string) => false,
      keys: async () => [],
    }

    expect(typeof engine.get).toBe('function')
    expect(typeof engine.set).toBe('function')
    expect(typeof engine.remove).toBe('function')
    expect(typeof engine.clear).toBe('function')
    expect(typeof engine.has).toBe('function')
    expect(typeof engine.keys).toBe('function')
  })
})

