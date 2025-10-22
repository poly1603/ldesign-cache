/**
 * 高级用法示例
 * 
 * 展示 @ldesign/cache 的所有优化功能
 */

import {
  CacheManager,
  SyncManager,
  RemoteSyncManager,
  ErrorAggregator,
  gracefulDegradation,
  CacheErrorCode,
} from '@ldesign/cache'

/**
 * 示例 1: 完整的多设备协同应用
 */
export class AdvancedCacheApp {
  private cache: CacheManager
  private localSync: SyncManager
  private remoteSync: RemoteSyncManager
  private errorAggregator: ErrorAggregator

  constructor(userId: string, authToken: string) {
    // 1. 创建优化的缓存管理器
    this.cache = new CacheManager({
      // 基础配置
      defaultEngine: 'localStorage',
      keyPrefix: `app-${userId}`,
      defaultTTL: 24 * 60 * 60 * 1000, // 24小时

      // 启用智能策略
      strategy: {
        enabled: true,
        sizeThresholds: {
          small: 1024,           // 1KB - 使用 localStorage
          medium: 64 * 1024,     // 64KB - 使用 sessionStorage
          large: 1024 * 1024,    // 1MB+ - 使用 IndexedDB
        },
        ttlThresholds: {
          short: 5 * 60 * 1000,  // 5分钟 - 使用 memory
          medium: 60 * 60 * 1000,// 1小时 - 使用 sessionStorage
          long: 7 * 24 * 60 * 60 * 1000, // 7天 - 使用 localStorage
        },
      },

      // 安全配置
      security: {
        encryption: {
          enabled: true,
          algorithm: 'AES',
        },
        obfuscation: {
          enabled: true,
          algorithm: 'hash',
        },
      },

      // 性能优化
      cleanupInterval: 60000,     // 1分钟清理一次
      maxMemory: 50 * 1024 * 1024, // 50MB 内存限制
    })

    // 2. 跨标签页同步（带冲突解决）
    this.localSync = new SyncManager(this.cache, {
      enabled: true,
      channel: `app-${userId}-sync`,

      // 冲突解决策略
      conflictResolution: 'custom',
      customResolver: (local, remote) => {
        // 自定义合并逻辑
        if (typeof local.value === 'object' && typeof remote.value === 'object') {
          return {
            ...remote,
            value: {
              ...local.value,
              ...remote.value,
              _mergedAt: Date.now(),
            },
          }
        }
        return remote.timestamp > local.timestamp ? remote : local
      },

      // 优化配置
      debounce: 100,              // 100ms 防抖
      batchInterval: 500,         // 500ms 批量同步
      enableOfflineQueue: true,   // 离线队列
      maxOfflineQueueSize: 1000,  // 最多1000条
    })

    // 3. 跨设备同步
    this.remoteSync = new RemoteSyncManager({
      serverUrl: `wss://api.example.com/sync/${userId}`,
      transport: 'websocket',
      deviceId: this.getDeviceId(),
      authToken,
      heartbeatInterval: 30000,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
    })

    // 4. 错误聚合器
    this.errorAggregator = new ErrorAggregator()

    this.setupSyncHandlers()
    this.setupErrorHandlers()
  }

  /**
   * 获取或生成设备 ID
   */
  private getDeviceId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      let deviceId = window.localStorage.getItem('__device_id__')
      if (!deviceId) {
        deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        window.localStorage.setItem('__device_id__', deviceId)
      }
      return deviceId
    }
    return `device-${Date.now()}`
  }

  /**
   * 设置同步处理器
   */
  private setupSyncHandlers(): void {
    // 本地变更 -> 远程同步
    this.cache.on('set', async (event) => {
      const state = this.remoteSync.getConnectionState()

      if (state === 'connected') {
        try {
          await this.remoteSync.sync(event.key, {
            value: event.value,
            timestamp: event.timestamp,
            version: 1,
            source: this.getDeviceId(),
          }, 'set')
        }
        catch (error) {
          this.errorAggregator.add(error, {
            operation: 'remote-sync',
            key: event.key,
          })
        }
      }
    })

    // 远程变更 -> 本地应用
    this.remoteSync.on('message', async (message) => {
      if (message.type === 'sync' && message.data) {
        const { key, syncData, operation } = message.data

        try {
          if (operation === 'set') {
            await this.cache.set(key, syncData.value)
          }
          else if (operation === 'remove') {
            await this.cache.remove(key)
          }
        }
        catch (error) {
          this.errorAggregator.add(error, {
            operation: 'apply-remote-sync',
            key,
          })
        }
      }
    })

    // 监听同步冲突
    this.localSync.on('conflict', (message) => {
      console.warn('Sync conflict detected:', message)
      this.errorAggregator.add(new Error('Sync conflict'), {
        key: message.key,
        type: 'sync-conflict',
      })
    })
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandlers(): void {
    // 监听缓存错误
    this.cache.on('error', (event) => {
      this.errorAggregator.add(event.error, {
        key: event.key,
        engine: event.engine,
      })
    })

    // 监听连接状态
    this.remoteSync.on('state', (state) => {
      if (state === 'error') {
        this.errorAggregator.add(new Error('Remote sync connection error'), {
          state,
        })
      }
    })
  }

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    try {
      await this.remoteSync.connect()
      console.log('✅ Remote sync initialized')
    }
    catch (error) {
      console.error('Failed to initialize remote sync:', error)
      this.errorAggregator.add(error, { operation: 'initialize' })
    }
  }

  /**
   * 设置数据（带优雅降级）
   */
  async set(key: string, value: any, options?: any): Promise<void> {
    await gracefulDegradation(
      async () => {
        // 主要操作：正常设置
        await this.cache.set(key, value, options)
      },
      [
        // 降级 1：禁用加密重试
        async () => {
          await this.cache.set(key, value, { ...options, encrypt: false })
        },
        // 降级 2：使用内存引擎
        async () => {
          await this.cache.set(key, value, { ...options, engine: 'memory' })
        },
      ],
    )
  }

  /**
   * 获取数据（带优雅降级）
   */
  async get<T>(key: string): Promise<T | null> {
    return gracefulDegradation(
      async () => this.cache.get<T>(key),
      [
        // 降级：从远程获取
        async () => this.fetchFromRemote<T>(key),
        // 降级：返回默认值
        async () => null,
      ],
    )
  }

  /**
   * 从远程获取（模拟）
   */
  private async fetchFromRemote<T>(_key: string): Promise<T | null> {
    // 这里可以实现从服务器获取数据的逻辑
    return null
  }

  /**
   * 批量设置（利用引擎批量 API）
   */
  async batchSet(items: Record<string, any>, options?: any): Promise<void> {
    const itemsArray = Object.entries(items).map(([key, value]) => ({
      key,
      value,
      options,
    }))

    const result = await this.cache.mset(itemsArray)

    if (result.failed.length > 0) {
      console.warn(`${result.failed.length} items failed to set`)
      result.failed.forEach(f => {
        this.errorAggregator.add(f.error, { key: f.key })
      })
    }
  }

  /**
   * 批量获取（利用引擎批量 API）
   */
  async batchGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    return this.cache.mget<T>(keys)
  }

  /**
   * 获取错误报告
   */
  getErrorReport(): string {
    return this.errorAggregator.generateReport()
  }

  /**
   * 获取完整状态
   */
  getStatus(): {
    cache: any
    localSync: any
    remoteSync: string
    errors: any
  } {
    return {
      cache: this.cache.getStats(),
      localSync: this.localSync.getSyncStatus(),
      remoteSync: this.remoteSync.getConnectionState(),
      errors: this.errorAggregator.getStats(),
    }
  }

  /**
   * 优化内存
   */
  async optimizeMemory(): Promise<void> {
    await this.cache.optimizeMemory()
    console.log('✅ Memory optimized')
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.remoteSync.destroy()
    this.localSync.destroy()
    this.cache.destroy()
    this.errorAggregator.clear()
  }
}

/**
 * 示例 2: 高性能数据同步
 */
export class HighPerformanceSync {
  private cache: CacheManager
  private pendingSync: Map<string, any> = new Map()
  private syncTimer?: number

  constructor() {
    this.cache = new CacheManager({
      defaultEngine: 'memory',  // 使用内存引擎获得最佳性能

      engines: {
        memory: {
          maxSize: 100 * 1024 * 1024,  // 100MB
          maxItems: 10000,
          evictionStrategy: 'LRU',     // LRU 淘汰策略
        },
      },
    })

    this.setupBatchSync()
  }

  /**
   * 设置批量同步
   */
  private setupBatchSync(): void {
    this.cache.on('set', (event) => {
      // 累积变更
      this.pendingSync.set(event.key, event.value)

      // 批量刷新
      if (!this.syncTimer) {
        this.syncTimer = window.setTimeout(() => {
          this.flushSync()
        }, 1000) // 1秒批量一次
      }
    })
  }

  /**
   * 刷新同步
   */
  private async flushSync(): Promise<void> {
    if (this.pendingSync.size === 0) {
      return
    }

    const items = Array.from(this.pendingSync.entries()).map(([key, value]) => ({
      key,
      value,
    }))

    this.pendingSync.clear()
    this.syncTimer = undefined

    // 使用批量 API
    await this.cache.mset(items)

    console.log(`✅ Synced ${items.length} items`)
  }

  /**
   * 设置数据
   */
  async set(key: string, value: any): Promise<void> {
    await this.cache.set(key, value)
  }

  /**
   * 获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key)
  }
}

/**
 * 示例 3: 错误处理和恢复
 */
export class ResilientCache {
  private cache: CacheManager
  private fallbackCache: Map<string, any> = new Map()
  private errorAggregator: ErrorAggregator

  constructor() {
    this.cache = new CacheManager({
      defaultEngine: 'localStorage',
    })

    this.errorAggregator = new ErrorAggregator()
  }

  /**
   * 设置数据（带错误恢复）
   */
  async set(key: string, value: any, options?: any): Promise<void> {
    await gracefulDegradation(
      async () => {
        // 主要操作
        await this.cache.set(key, value, options)
      },
      [
        // 降级 1：使用内存引擎
        async () => {
          console.warn('Falling back to memory engine')
          await this.cache.set(key, value, { ...options, engine: 'memory' })
        },
        // 降级 2：使用内存 Map
        async () => {
          console.warn('Falling back to memory Map')
          this.fallbackCache.set(key, value)
        },
      ],
    )
  }

  /**
   * 获取数据（带错误恢复）
   */
  async get<T>(key: string): Promise<T | null> {
    return gracefulDegradation(
      async () => this.cache.get<T>(key),
      [
        // 降级：从内存 Map 获取
        async () => {
          const value = this.fallbackCache.get(key)
          return value !== undefined ? value : null
        },
        // 最后降级：返回 null
        async () => null,
      ],
    )
  }

  /**
   * 获取错误报告
   */
  getErrorReport(): string {
    return this.errorAggregator.generateReport()
  }
}

/**
 * 示例 4: 性能监控
 */
export class MonitoredCache {
  private cache: CacheManager
  private metrics = {
    totalSets: 0,
    totalGets: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageSetTime: 0,
    averageGetTime: 0,
  }

  constructor() {
    this.cache = new CacheManager({
      defaultEngine: 'localStorage',
      debug: true,
    })

    this.setupMonitoring()
  }

  /**
   * 设置监控
   */
  private setupMonitoring(): void {
    this.cache.on('set', (event) => {
      this.metrics.totalSets++
    })

    this.cache.on('get', (event) => {
      this.metrics.totalGets++
      this.metrics.cacheHits++
    })
  }

  /**
   * 设置数据（带性能监控）
   */
  async set(key: string, value: any, options?: any): Promise<void> {
    const start = performance.now()

    try {
      await this.cache.set(key, value, options)
    }
    finally {
      const duration = performance.now() - start
      this.updateAverageTime('set', duration)
    }
  }

  /**
   * 获取数据（带性能监控）
   */
  async get<T>(key: string): Promise<T | null> {
    const start = performance.now()

    try {
      const value = await this.cache.get<T>(key)

      if (value === null) {
        this.metrics.cacheMisses++
      }

      return value
    }
    finally {
      const duration = performance.now() - start
      this.updateAverageTime('get', duration)
    }
  }

  /**
   * 更新平均时间
   */
  private updateAverageTime(operation: 'set' | 'get', duration: number): void {
    if (operation === 'set') {
      const total = this.metrics.averageSetTime * (this.metrics.totalSets - 1)
      this.metrics.averageSetTime = (total + duration) / this.metrics.totalSets
    }
    else {
      const total = this.metrics.averageGetTime * (this.metrics.totalGets - 1)
      this.metrics.averageGetTime = (total + duration) / this.metrics.totalGets
    }
  }

  /**
   * 获取性能指标
   */
  getMetrics(): typeof this.metrics {
    return { ...this.metrics }
  }

  /**
   * 获取详细统计
   */
  async getDetailedStats(): Promise<any> {
    const cacheStats = await this.cache.getStats()
    const metrics = this.getMetrics()

    return {
      cache: cacheStats,
      performance: metrics,
      hitRate: metrics.totalGets > 0
        ? (metrics.cacheHits / metrics.totalGets) * 100
        : 0,
    }
  }
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  // 示例 1: 高级缓存应用
  const app = new AdvancedCacheApp('user-123', 'auth-token-xyz')
  await app.initialize()

  // 设置数据
  await app.set('user-preferences', {
    theme: 'dark',
    language: 'zh-CN',
    notifications: true,
  })

  // 批量设置
  await app.batchSet({
    'setting1': 'value1',
    'setting2': 'value2',
    'setting3': 'value3',
  })

  // 批量获取
  const settings = await app.batchGet(['setting1', 'setting2', 'setting3'])
  console.log('Settings:', settings)

  // 查看状态
  const status = await app.getStatus()
  console.log('Status:', status)

  // 查看错误报告
  console.log(app.getErrorReport())

  // 示例 2: 高性能同步
  const highPerf = new HighPerformanceSync()
  await highPerf.set('key1', 'value1')
  await highPerf.set('key2', 'value2')
  // 会自动批量同步

  // 示例 3: 错误恢复
  const resilient = new ResilientCache()
  await resilient.set('important-data', { critical: true })
  // 即使 localStorage 失败，也会降级到内存

  // 示例 4: 性能监控
  const monitored = new MonitoredCache()
  await monitored.set('test', 'value')
  await monitored.get('test')

  const stats = await monitored.getDetailedStats()
  console.log('Performance stats:', stats)
}

// 运行示例（在浏览器环境中）
if (typeof window !== 'undefined') {
  (window as any).cacheExamples = {
    AdvancedCacheApp,
    HighPerformanceSync,
    ResilientCache,
    MonitoredCache,
    exampleUsage,
  }
}

