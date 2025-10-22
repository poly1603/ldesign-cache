# 快速参考手册

## 📦 安装

```bash
pnpm add @ldesign/cache
```

---

## 🚀 基础 API

### 创建缓存

```typescript
import { createCache } from '@ldesign/cache'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 3600000,  // 1小时
})
```

### CRUD 操作

```typescript
// 设置
await cache.set('key', 'value')
await cache.set('key', 'value', { ttl: 5000 })  // 带TTL

// 获取
const value = await cache.get('key')

// 删除
await cache.remove('key')

// 清空
await cache.clear()

// 检查
const exists = await cache.has('key')

// 列出所有键
const keys = await cache.keys()

// 获取或设置
const data = await cache.remember('key', async () => {
  return await fetchData()
}, { ttl: 60000 })
```

### 批量操作

```typescript
// 批量设置
await cache.mset([
  { key: 'k1', value: 'v1' },
  { key: 'k2', value: 'v2' },
])

// 批量获取
const values = await cache.mget(['k1', 'k2'])
// { k1: 'v1', k2: 'v2' }

// 批量删除
await cache.mremove(['k1', 'k2'])

// 批量检查
const exists = await cache.mhas(['k1', 'k2'])
// { k1: true, k2: false }
```

---

## 🔄 跨标签页同步

### 基础同步

```typescript
import { SyncManager } from '@ldesign/cache'

const sync = new SyncManager(cache, {
  enabled: true,
  channel: 'my-app',
})
```

### 冲突解决

```typescript
const sync = new SyncManager(cache, {
  conflictResolution: 'last-write-wins',  // 或其他策略
  customResolver: (local, remote) => {
    return remote.timestamp > local.timestamp ? remote : local
  },
})
```

### 离线队列

```typescript
const sync = new SyncManager(cache, {
  enableOfflineQueue: true,
  maxOfflineQueueSize: 1000,
})
```

### 批量同步

```typescript
const sync = new SyncManager(cache, {
  batchInterval: 500,  // 500ms 批量
})
```

### 同步状态

```typescript
const status = sync.getSyncStatus()
console.log(status.stats)      // { sent, received, conflicts, resolved }
console.log(status.queueSize)  // 队列大小
```

### 事件监听

```typescript
sync.on('sync', (message) => {
  console.log('Sync:', message)
})

sync.on('conflict', (message) => {
  console.warn('Conflict:', message)
})
```

---

## 🌐 跨设备同步

### WebSocket

```typescript
import { RemoteSyncManager } from '@ldesign/cache'

const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  transport: 'websocket',
  authToken: 'your-token',
})

await remoteSync.connect()
```

### 监听远程变更

```typescript
remoteSync.on('message', async (message) => {
  if (message.data) {
    await cache.set(message.data.key, message.data.syncData.value)
  }
})
```

### 同步本地变更

```typescript
cache.on('set', async (event) => {
  await remoteSync.sync(event.key, {
    value: event.value,
    timestamp: event.timestamp,
    version: 1,
    source: deviceId,
  }, 'set')
})
```

### 连接状态

```typescript
remoteSync.on('state', (state) => {
  console.log('Connection:', state)
  // 'connected' | 'connecting' | 'disconnected' | 'error'
})
```

---

## 📉 Delta 同步

### 基础使用

```typescript
import { withDeltaSync } from '@ldesign/cache'

const deltaCache = withDeltaSync(cache)

await deltaCache.deltaSet('doc', largeDocument)
const doc = await deltaCache.deltaGet('doc')
```

### 手动 Delta

```typescript
import { DeltaSync } from '@ldesign/cache'

const delta = DeltaSync.diff(oldObj, newObj)
console.log(delta.changes)      // 变更列表
console.log(delta.changeCount)  // 变更数量

const patched = DeltaSync.patch(oldObj, delta.changes)
```

---

## 📸 快照管理

### 创建快照

```typescript
import { createSnapshotManager } from '@ldesign/cache'

const snapshotMgr = createSnapshotManager(cache)

const snapshot = await snapshotMgr.create({
  name: 'backup-2025',
})
```

### 恢复快照

```typescript
await snapshotMgr.restore(snapshot, {
  clear: true,  // 清空现有缓存
})
```

### 增量快照

```typescript
const baseSnapshot = await snapshotMgr.create()

// ... 数据变更 ...

const deltaSnapshot = await snapshotMgr.createDeltaSnapshot(baseSnapshot)

// 恢复
await snapshotMgr.restoreDeltaSnapshot(deltaSnapshot, baseSnapshot)
```

### 自动快照

```typescript
const stop = snapshotMgr.autoSnapshot(
  { name: 'auto' },
  60000,   // 每分钟
  true     // 使用增量
)

// 停止自动快照
stop()
```

---

## 🛠️ 开发工具

### 安装 DevTools

```typescript
import { installDevTools } from '@ldesign/cache'

installDevTools(cache)
```

### 控制台命令

```typescript
// 统计信息
__CACHE_DEVTOOLS__.stats()

// 所有缓存项
__CACHE_DEVTOOLS__.items()

// 搜索
__CACHE_DEVTOOLS__.search(/user/)

// 健康检查
__CACHE_DEVTOOLS__.health()

// 完整报告
__CACHE_DEVTOOLS__.report()

// 热点键
__CACHE_DEVTOOLS__.hotKeys(10)

// 大数据项
__CACHE_DEVTOOLS__.largest(10)

// 即将过期
__CACHE_DEVTOOLS__.expiring(60000)

// 可视化数据
__CACHE_DEVTOOLS__.visualize()
```

### 性能分析

```typescript
import { createPerformanceProfiler } from '@ldesign/cache'

const profiler = createPerformanceProfiler(cache, {
  slowThreshold: 100,
  samplingRate: 0.1,
})

// 测量操作
await profiler.measure('custom-op', async () => {
  await cache.set('key', 'value')
})

// 生成报告
console.log(profiler.generateReport())
```

---

## 🔧 错误处理

### 优雅降级

```typescript
import { gracefulDegradation } from '@ldesign/cache'

const data = await gracefulDegradation(
  () => cache.get('key'),
  [
    () => fetchFromAPI(),
    () => getDefaultValue(),
  ]
)
```

### 错误聚合

```typescript
import { ErrorAggregator } from '@ldesign/cache'

const errorAgg = new ErrorAggregator()

cache.on('error', (event) => {
  errorAgg.add(event.error)
})

// 报告
console.log(errorAgg.generateReport())

// 统计
const stats = errorAgg.getStats()
console.log(stats.byCode)       // 按错误码
console.log(stats.bySeverity)   // 按严重程度
```

### 错误码

```typescript
import { CacheErrorCode } from '@ldesign/cache'

// 验证错误
CacheErrorCode.INVALID_KEY        // E1001
CacheErrorCode.INVALID_VALUE      // E1002

// 存储错误
CacheErrorCode.STORAGE_QUOTA_EXCEEDED  // E2002

// 序列化错误
CacheErrorCode.SERIALIZATION_FAILED    // E3001

// 同步错误
CacheErrorCode.SYNC_CONFLICT           // E6001
```

---

## ⚙️ 配置选项

### CacheOptions

```typescript
interface CacheOptions {
  // 基础
  defaultEngine?: StorageEngine
  defaultTTL?: number
  keyPrefix?: string
  debug?: boolean
  
  // 内存
  maxMemory?: number
  cleanupInterval?: number
  
  // 安全
  security?: {
    encryption?: { enabled: boolean, algorithm?: 'AES' }
    obfuscation?: { enabled: boolean, algorithm?: 'hash' | 'base64' }
  }
  
  // 策略
  strategy?: {
    enabled: boolean
    sizeThresholds?: { small, medium, large }
    ttlThresholds?: { short, medium, long }
  }
  
  // 引擎配置
  engines?: {
    memory?: { maxSize, maxItems, evictionStrategy }
    localStorage?: { maxSize, keyPrefix }
    indexedDB?: { dbName, version, storeName }
  }
  
  // 预取
  enablePrefetch?: boolean
  prefetch?: { strategy, fetcher }
}
```

### SyncOptions

```typescript
interface SyncOptions {
  enabled?: boolean
  channel?: string
  debounce?: number
  engines?: StorageEngine[]
  events?: Array<'set' | 'remove' | 'clear'>
  
  // 🆕 v0.2.0
  conflictResolution?: ConflictResolutionStrategy
  customResolver?: (local, remote) => SyncData
  enableOfflineQueue?: boolean
  maxOfflineQueueSize?: number
  batchInterval?: number
}
```

### RemoteSyncOptions

```typescript
interface RemoteSyncOptions {
  serverUrl: string
  transport?: 'websocket' | 'polling' | 'sse'
  deviceId?: string
  authToken?: string
  heartbeatInterval?: number
  reconnectDelay?: number
  maxReconnectAttempts?: number
  timeout?: number
  compression?: boolean
}
```

---

## 📊 统计和监控

### 缓存统计

```typescript
const stats = await cache.getStats()

console.log(stats.totalItems)   // 总项数
console.log(stats.totalSize)    // 总大小
console.log(stats.hitRate)      // 命中率
console.log(stats.engines)      // 各引擎统计
```

### 内存优化

```typescript
await cache.optimizeMemory()
```

### 清理过期

```typescript
await cache.cleanup()
```

---

## 🎨 Vue 3 集成

### 基础用法

```typescript
import { useCache } from '@ldesign/cache/vue'

const { set, get, loading, error } = useCache()

await set('key', 'value')
const value = await get('key')
```

### 响应式缓存

```typescript
const { useCacheValue } = useCache()

const username = useCacheValue('username', '', {
  autoSave: { debounce: 500 }
})

// 修改会自动保存
username.value = 'John'
```

### 缓存统计

```typescript
import { useCacheStats } from '@ldesign/cache/vue'

const { stats, formattedStats, refresh } = useCacheStats({
  refreshInterval: 5000
})
```

---

## 📚 更多资源

- [完整文档](./docs)
- [升级指南](./UPGRADE_GUIDE.md)
- [优化报告](./FINAL_OPTIMIZATION_REPORT.md)
- [示例代码](./examples)
- [API 文档](./docs/api)

---

**快速查找小贴士:** 使用 Ctrl+F 搜索本文档快速定位所需 API

