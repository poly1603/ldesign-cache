# @ldesign/cache-core

> 功能强大的浏览器缓存管理库 - 核心功能包

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-core.svg)](https://www.npmjs.com/package/@ldesign/cache-core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ldesign/cache-core)](https://bundlephobia.com/package/@ldesign/cache-core)
[![license](https://img.shields.io/npm/l/@ldesign/cache-core.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🚀 **多存储引擎** - 支持 Memory、LocalStorage、SessionStorage、IndexedDB、Cookie、OPFS
- 📦 **智能策略** - 自适应存储策略、智能预取、预测性缓存
- 🔒 **安全加固** - AES 加密、键名混淆、安全管理器
- ⚡ **高性能** - 内存管理、对象池、零拷贝优化
- 📊 **性能监控** - 详细的性能追踪和分析工具
- 🔄 **跨标签页同步** - 支持多标签页数据同步
- 🌐 **跨设备同步** - 支持 WebSocket/轮询/SSE 远程同步
- 🎯 **TypeScript** - 完整的类型定义支持

## 安装

```bash
# npm
npm install @ldesign/cache-core

# yarn
yarn add @ldesign/cache-core

# pnpm
pnpm add @ldesign/cache-core
```

## 快速开始

### 基础使用

```typescript
import { createCache } from '@ldesign/cache-core'

// 创建缓存实例
const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 60 * 1000, // 1小时
})

// 设置缓存
await cache.set('user', { name: '张三', age: 25 })

// 获取缓存
const user = await cache.get('user')
console.log(user) // { name: '张三', age: 25 }

// 记忆函数模式
const userData = await cache.remember('user-data', async () => {
  return await fetch('/api/user').then(r => r.json())
}, { ttl: 5 * 60 * 1000 })
```

### 使用便捷 API

```typescript
import { cache } from '@ldesign/cache-core'

// 直接使用全局实例
await cache.set('key', 'value')
const value = await cache.get('key')
await cache.remove('key')
await cache.clear()
```

### 多存储引擎

```typescript
import { createCache } from '@ldesign/cache-core'

const cache = createCache()

// 使用不同的存储引擎
await cache.set('session-key', 'value', { engine: 'sessionStorage' })
await cache.set('local-key', 'value', { engine: 'localStorage' })
await cache.set('memory-key', 'value', { engine: 'memory' })
await cache.set('db-key', 'large-data', { engine: 'indexedDB' })
```

### 性能监控

```typescript
import { createCache, PerformanceTracker } from '@ldesign/cache-core'

const cache = createCache({
  enablePerformanceTracking: true
})

const tracker = new PerformanceTracker(cache)

// 获取性能指标
const metrics = tracker.getMetrics()
console.log('命中率:', metrics.efficiency.hitRate)
console.log('平均响应时间:', metrics.operations.get.averageTime)
```

### 智能预取

```typescript
import { createCache, createPrefetchManager } from '@ldesign/cache-core'

const cache = createCache()
const prefetch = createPrefetchManager(cache)

// 根据访问模式自动预取
prefetch.recordAccess('user-123')
prefetch.recordAccess('posts-123')

// 预热常用数据
await prefetch.warmup(['user-123', 'user-456'])
```

### 跨标签页同步

```typescript
import { createCache, SyncManager } from '@ldesign/cache-core'

const cache = createCache()
const sync = new SyncManager(cache, {
  channel: 'my-app-cache',
  conflictResolution: 'last-write-wins'
})

// 自动同步所有标签页的缓存操作
await cache.set('shared-key', 'value')
// 其他标签页会自动收到更新
```

## API 文档

完整的 API 文档请访问：[LDesign Cache Documentation](https://ldesign.dev/cache/core)

## 许可证

MIT License © LDesign Team


