# 🚀 @ldesign/cache

> 高性能、类型安全的 JavaScript/TypeScript 缓存管理库

[![npm version](https://img.shields.io/npm/v/@ldesign/cache.svg)](https://www.npmjs.com/package/@ldesign/cache)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@ldesign/cache.svg)](./LICENSE)

## ✨ 特性

- 🎯 **多种缓存策略** - LRU、LFU、FIFO、TTL 多种淘汰策略
- 💾 **多存储后端** - Memory、LocalStorage、SessionStorage、IndexedDB
- 🔒 **类型安全** - 完整的 TypeScript 类型支持和泛型约束
- 📊 **性能监控** - 内置性能追踪和统计分析插件
- 🔌 **插件系统** - 灵活的插件架构，支持自定义扩展
- ⚡ **高性能** - 精确的内存估算和优化的数据结构
- 🛠️ **实用工具** - 防抖、节流、内存追踪等实用函数

## 📦 安装

```bash
# pnpm (推荐)
pnpm add @ldesign/cache

# npm
npm install @ldesign/cache

# yarn
yarn add @ldesign/cache
```

## 🚀 快速开始

### 基础使用

```typescript
import { createCacheManager, CacheStrategy } from '@ldesign/cache'

// 创建缓存管理器
const cache = createCacheManager<string>({
  strategy: CacheStrategy.LRU,
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 分钟
  enableStats: true,
})

// 设置缓存
cache.set('user:1', 'Alice')
cache.set('user:2', 'Bob', 10000) // 10 秒后过期

// 获取缓存
const user = cache.get('user:1') // 'Alice'

// 检查存在性
if (cache.has('user:1')) {
  console.log('用户存在')
}

// 删除缓存
cache.delete('user:1')

// 获取统计信息
const stats = cache.getStats()
console.log(`命中率: ${(stats.hitRate * 100).toFixed(2)}%`)
```

### 缓存策略

```typescript
import { LRUCache, LFUCache, FIFOCache, TTLCache } from '@ldesign/cache'

// LRU - 最近最少使用
const lru = new LRUCache<string>(100)
lru.set('key', 'value')

// LFU - 最不经常使用
const lfu = new LFUCache<string>(100)
lfu.set('key', 'value')

// FIFO - 先进先出
const fifo = new FIFOCache<string>(100)
fifo.set('key', 'value')

// TTL - 基于过期时间
const ttl = new TTLCache<string>(5 * 60 * 1000) // 默认 5 分钟
ttl.set('key', 'value', 10000) // 自定义 10 秒
```

### 存储适配器

```typescript
import {
  MemoryStorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  IndexedDBStorageAdapter,
  createJSONSerializer,
} from '@ldesign/cache'

const serializer = createJSONSerializer()

// 内存存储
const memoryAdapter = new MemoryStorageAdapter(serializer)

// LocalStorage 存储
const localAdapter = new LocalStorageAdapter(serializer, 'my-app:')

// SessionStorage 存储
const sessionAdapter = new SessionStorageAdapter(serializer, 'my-app:')

// IndexedDB 存储 (异步)
const idbAdapter = new IndexedDBStorageAdapter(serializer, {
  dbName: 'my-cache',
  storeName: 'items',
  prefix: 'cache:',
})

await idbAdapter.initialize()
await idbAdapter.setItem('key', cacheItem)
const item = await idbAdapter.getItem('key')
```

### 批量操作

```typescript
const cache = createCacheManager()

// 批量设置
const setResult = cache.mset([
  ['user:1', { name: 'Alice' }],
  ['user:2', { name: 'Bob' }],
  ['user:3', { name: 'Charlie' }],
])

// 批量获取
const users = cache.mget(['user:1', 'user:2', 'user:3'])
// Map { 'user:1' => {...}, 'user:2' => {...}, 'user:3' => {...} }

// 批量删除
const delResult = cache.mdel(['user:1', 'user:2'])
```

### 事件监听

```typescript
import { CacheEventType } from '@ldesign/cache'

const cache = createCacheManager()

// 监听缓存命中
cache.on(CacheEventType.HIT, (event) => {
  console.log(`命中: ${event.key}`)
})

// 监听缓存未命中
cache.on(CacheEventType.MISS, (event) => {
  console.log(`未命中: ${event.key}`)
})

// 监听淘汰事件
cache.on(CacheEventType.EVICT, (event) => {
  console.log(`淘汰: ${event.key}`)
})

// 移除监听器
cache.off(CacheEventType.HIT, handler)
```

## 🔌 插件系统

### 日志插件

```typescript
import { createCacheManager, createLoggerPlugin } from '@ldesign/cache'

const logger = createLoggerPlugin({
  level: 'debug',
  enabled: true,
})

const cache = createCacheManager({
  plugins: [logger],
})
```

### 性能监控插件

```typescript
import { createCacheManager, createPerformancePlugin } from '@ldesign/cache'

const performance = createPerformancePlugin({
  slowThreshold: 50, // 50ms 为慢操作
  maxMetrics: 1000,
  samplingRate: 1.0, // 全量采集
  onSlowOperation: (metric) => {
    console.warn('慢操作:', metric)
  },
})

const cache = createCacheManager({
  plugins: [performance],
})

// 获取性能统计
const stats = performance.getStats()
console.log(`平均耗时: ${stats.avgDuration.toFixed(3)}ms`)
console.log(`P95: ${stats.p95Duration.toFixed(3)}ms`)

// 获取命中率
const hitRate = performance.getHitRate()
console.log(`命中率: ${(hitRate.rate * 100).toFixed(2)}%`)

// 生成报告
console.log(performance.generateReport())
```

## 🛠️ 工具函数

### 内存估算

```typescript
import { estimateMemoryUsage, formatBytes, MemoryTracker } from '@ldesign/cache'

// 估算对象内存占用
const data = { name: '张三', scores: [90, 85, 92] }
const size = estimateMemoryUsage(data)
console.log(`内存占用: ${formatBytes(size)}`) // "内存占用: 256 Bytes"

// 内存追踪器
const tracker = new MemoryTracker()
tracker.track('user:1', { name: 'Alice' })
tracker.track('user:2', { name: 'Bob' })

console.log(`总内存: ${tracker.getFormattedTotal()}`)
console.log(`摘要:`, tracker.getSummary())
```

### 防抖与节流

```typescript
import { debounce, throttle, createKeyedDebounce } from '@ldesign/cache'

// 防抖
const debouncedSave = debounce(
  (data) => cache.set('draft', data),
  { wait: 500, leading: false, trailing: true }
)

// 连续调用只执行最后一次
debouncedSave({ text: 'hello' })
debouncedSave({ text: 'hello world' })
// 500ms 后执行一次

// 节流
const throttledUpdate = throttle(
  (stats) => cache.set('stats', stats),
  { wait: 1000 }
)

// 每秒最多执行一次

// 按键防抖（适用于缓存场景）
const debouncedSet = createKeyedDebounce(
  (key, value) => cache.set(key, value),
  500
)

// 相同键的调用会被防抖，不同键独立
debouncedSet('user:1', { name: 'Alice' })
debouncedSet('user:1', { name: 'Alice Updated' }) // 会替代上一次
debouncedSet('user:2', { name: 'Bob' }) // 独立防抖
```

## 📖 API 参考

### CacheManager

| 方法 | 描述 |
|------|------|
| `get(key)` | 获取缓存值 |
| `set(key, value, ttl?)` | 设置缓存值 |
| `delete(key)` | 删除缓存项 |
| `has(key)` | 检查缓存是否存在 |
| `clear()` | 清空所有缓存 |
| `keys()` | 获取所有键 |
| `values()` | 获取所有值 |
| `entries()` | 获取所有键值对 |
| `getItem(key)` | 获取缓存项详情 |
| `mget(keys)` | 批量获取 |
| `mset(entries, options?)` | 批量设置 |
| `mdel(keys, options?)` | 批量删除 |
| `getStats()` | 获取统计信息 |
| `resetStats()` | 重置统计 |
| `cleanup()` | 清理过期项 |
| `on(type, listener)` | 添加事件监听 |
| `off(type, listener)` | 移除事件监听 |
| `destroy()` | 销毁实例 |

### CacheOptions

```typescript
interface CacheOptions<T> {
  strategy?: CacheStrategy     // 缓存策略，默认 LRU
  maxSize?: number             // 最大容量，默认 100
  defaultTTL?: number          // 默认 TTL（毫秒）
  enableStats?: boolean        // 启用统计，默认 true
  enablePersistence?: boolean  // 启用持久化，默认 false
  storageType?: StorageType    // 存储类型
  storagePrefix?: string       // 存储键前缀
  cleanupInterval?: number     // 自动清理间隔
  namespace?: string           // 命名空间
  serializer?: Serializer<T>   // 序列化器
  plugins?: CachePlugin<T>[]   // 插件列表
  onEvict?: (key, value, reason) => void  // 淘汰回调
  onExpire?: (key, value) => void         // 过期回调
  onError?: (error) => void               // 错误回调
}
```

### CacheStrategy

```typescript
enum CacheStrategy {
  LRU = 'lru',   // 最近最少使用
  LFU = 'lfu',   // 最不经常使用
  FIFO = 'fifo', // 先进先出
  TTL = 'ttl',   // 基于过期时间
  ARC = 'arc',   // 自适应替换缓存
}
```

## 🔧 类型定义

```typescript
// 缓存项
interface CacheItem<T> {
  readonly key: string
  value: T
  createdAt: number
  lastAccessedAt: number
  accessCount: number
  expiresAt?: number
  ttl?: number
  tags?: string[]
  namespace?: string
  version?: number
  priority?: number
  size?: number
}

// 缓存统计
interface CacheStats {
  size: number
  maxSize: number
  totalRequests: number
  hits: number
  misses: number
  hitRate: number
  evictions: number
  expirations: number
  memoryUsage: number
  avgResponseTime?: number
  p95ResponseTime?: number
  p99ResponseTime?: number
}

// 批量操作结果
interface BatchResult<T> {
  succeeded: string[]
  failed: Array<{ key: string, error: Error }>
  results: Map<string, T>
  duration: number
  readonly allSucceeded: boolean
}
```

## 🌍 浏览器支持

| 浏览器 | 版本 | Memory | LocalStorage | SessionStorage | IndexedDB |
|--------|------|--------|--------------|----------------|-----------|
| Chrome | 60+ | ✅ | ✅ | ✅ | ✅ |
| Firefox | 55+ | ✅ | ✅ | ✅ | ✅ |
| Safari | 12+ | ✅ | ✅ | ✅ | ✅ |
| Edge | 79+ | ✅ | ✅ | ✅ | ✅ |

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

## 📄 许可证

[MIT](./LICENSE) © LDesign Team
