# @ldesign/cache-core

企业级缓存管理库 - 核心模块

## 特性

- 🚀 **多种缓存策略** - 支持 LRU、LFU、FIFO、TTL 四种缓存策略
- 📊 **统计功能** - 完整的缓存命中率、淘汰次数等统计信息
- ⚡ **高性能** - O(1) 时间复杂度的核心操作
- 💾 **持久化** - 支持 localStorage/sessionStorage 持久化
- 🎯 **类型安全** - 完整的 TypeScript 类型定义
- 🔔 **事件系统** - 支持监听缓存操作事件
- 📦 **批量操作** - 支持批量读写操作
- 🧹 **自动清理** - 自动清理过期项

## 安装

```bash
pnpm add @ldesign/cache-core
```

## 快速开始

### LRU 缓存

```typescript
import { CacheManager, CacheStrategy } from '@ldesign/cache-core'

const cache = new CacheManager({
  strategy: CacheStrategy.LRU,
  maxSize: 100,
  defaultTTL: 5000, // 5秒过期
  enableStats: true
})

// 设置缓存
cache.set('key1', 'value1')
cache.set('key2', 'value2', 10000) // 自定义 TTL

// 获取缓存
const value = cache.get('key1')

// 删除缓存
cache.delete('key1')

// 获取统计信息
const stats = cache.getStats()
console.log('命中率:', stats.hitRate)
```

### LFU 缓存

```typescript
const cache = new CacheManager({
  strategy: CacheStrategy.LFU,
  maxSize: 100
})

// LFU 会淘汰访问频率最低的项
cache.set('key1', 'value1')
cache.get('key1') // 频率 +1
cache.get('key1') // 频率 +1
// key1 频率高，不容易被淘汰
```

### FIFO 缓存

```typescript
const cache = new CacheManager({
  strategy: CacheStrategy.FIFO,
  maxSize: 100
})

// FIFO 先进先出，最早添加的项会被优先淘汰
cache.set('key1', 'value1')
cache.set('key2', 'value2')
// 当容量满时，key1 会被最先淘汰
```

### TTL 缓存

```typescript
const cache = new CacheManager({
  strategy: CacheStrategy.TTL,
  defaultTTL: 5000, // 默认 5 秒过期
  cleanupInterval: 1000 // 每秒清理一次
})

cache.set('key1', 'value1') // 5 秒后过期
cache.set('key2', 'value2', 10000) // 10 秒后过期

// 5 秒后
console.log(cache.get('key1')) // undefined (已过期)
```

## 事件监听

```typescript
// 监听缓存命中
cache.on('hit', (event) => {
  console.log('缓存命中:', event.key)
})

// 监听缓存未命中
cache.on('miss', (event) => {
  console.log('缓存未命中:', event.key)
})

// 监听缓存淘汰
cache.on('evict', (event) => {
  console.log('缓存淘汰:', event.key, event.value)
})

// 监听缓存过期
cache.on('expire', (event) => {
  console.log('缓存过期:', event.key)
})
```

## 批量操作

```typescript
// 批量设置
cache.mset([
  ['key1', 'value1'],
  ['key2', 'value2'],
  ['key3', 'value3']
], { ttl: 5000 })

// 批量获取
const values = cache.mget(['key1', 'key2', 'key3'])

// 批量删除
cache.mdel(['key1', 'key2'])
```

## 持久化

```typescript
const cache = new CacheManager({
  strategy: CacheStrategy.LRU,
  maxSize: 100,
  enablePersistence: true,
  storageType: 'localStorage', // 或 'sessionStorage'
  storagePrefix: 'my-cache:'
})

// 缓存会自动保存到 localStorage
cache.set('key1', 'value1')

// 刷新页面后，缓存会自动恢复
```

## API 文档

详细 API 文档请参考 TypeScript 类型定义。

## License

MIT

