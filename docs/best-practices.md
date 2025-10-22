# 性能最佳实践

## 🎯 概述

本文档提供使用 `@ldesign/cache` 的性能最佳实践，帮助您充分利用 v0.2.0 的所有优化。

---

## ⚡ 性能优化建议

### 1. 利用智能路由缓存（自动启用）

智能路由会自动缓存键到引擎的映射，无需任何配置：

```typescript
// ✅ 好：正常使用即可
const value = await cache.get('user-data')
// 第一次查询会遍历引擎
// 后续查询直接命中目标引擎（速度提升 66%）

// ❌ 不需要：手动指定引擎（除非有特殊需求）
const value = await cache.get('user-data', { engine: 'localStorage' })
```

**效果:** 缓存命中时查询速度自动提升 66%

### 2. 使用批量操作

对于多个操作，使用批量 API：

```typescript
// ❌ 不好：逐个操作
for (const item of items) {
  await cache.set(item.key, item.value)
}

// ✅ 好：批量操作
await cache.mset(items)
// 性能提升 50-200%（取决于引擎）
```

**适用场景:**
- 初始化时加载多个配置
- 批量导入数据
- 同步多个用户数据

### 3. 选择合适的存储引擎

根据数据特征选择引擎：

```typescript
// ✅ 好：启用智能策略，自动选择
const cache = createCache({
  strategy: {
    enabled: true,
    sizeThresholds: {
      small: 1024,        // <1KB -> localStorage
      medium: 64 * 1024,  // <64KB -> sessionStorage
      large: 1024 * 1024, // >1MB -> IndexedDB
    },
  },
})

await cache.set('small-config', config)      // 自动选 localStorage
await cache.set('large-dataset', bigData)   // 自动选 IndexedDB
```

**手动选择建议:**

| 数据类型 | 推荐引擎 | 原因 |
|----------|----------|------|
| 临时数据、会话状态 | memory | 最快，但刷新丢失 |
| 用户设置、配置 | localStorage | 持久化，中等速度 |
| 大型数据集 | indexedDB | 支持大容量 |
| 页面级数据 | sessionStorage | 标签页隔离 |

### 4. 合理设置 TTL

避免数据过期但仍占用空间：

```typescript
// ❌ 不好：没有 TTL
await cache.set('data', value)

// ✅ 好：根据数据性质设置 TTL
await cache.set('user-session', session, { 
  ttl: 2 * 60 * 60 * 1000  // 2小时
})

await cache.set('api-cache', apiData, { 
  ttl: 5 * 60 * 1000  // 5分钟
})

await cache.set('temp-token', token, { 
  ttl: 30 * 1000  // 30秒
})
```

### 5. 定期清理过期项

```typescript
// 自动清理（推荐）
const cache = createCache({
  cleanupInterval: 60000,  // 每分钟清理一次
})

// 手动清理
setInterval(async () => {
  await cache.cleanup()
  await cache.optimizeMemory()
}, 60000)
```

---

## 🔄 同步优化建议

### 1. 批量同步

累积变更批量发送：

```typescript
// ❌ 不好：每次变更立即同步
const sync = new SyncManager(cache)

// ✅ 好：批量同步
const sync = new SyncManager(cache, {
  batchInterval: 500,  // 500ms 批量
  debounce: 100,       // 100ms 防抖
})
```

**效果:** 同步消息减少 50-60%

### 2. 选择性同步

只同步需要的引擎和事件：

```typescript
const sync = new SyncManager(cache, {
  engines: ['localStorage'],     // 只同步 localStorage
  events: ['set', 'remove'],     // 不同步 clear
})
```

### 3. 冲突解决策略选择

| 场景 | 推荐策略 | 原因 |
|------|----------|------|
| 用户设置 | last-write-wins | 最后操作最重要 |
| 计数器 | custom | 需要累加 |
| 协同编辑 | custom | 需要合并 |
| 简单配置 | first-write-wins | 避免覆盖 |

```typescript
// 计数器示例
const sync = new SyncManager(cache, {
  conflictResolution: 'custom',
  customResolver: (local, remote) => {
    // 累加计数
    return {
      ...remote,
      value: local.value + remote.value,
    }
  },
})
```

### 4. Delta 同步（大对象）

对于大对象使用 Delta 同步：

```typescript
import { withDeltaSync, DeltaSync } from '@ldesign/cache'

// 检查是否值得
if (DeltaSync.shouldUseDelta(oldDoc, newDoc)) {
  const deltaCache = withDeltaSync(cache)
  await deltaCache.deltaSet('document', newDoc)
  // 节省 60-70% 数据量
}
```

---

## 💾 内存优化建议

### 1. 设置内存限制

```typescript
const cache = createCache({
  maxMemory: 50 * 1024 * 1024,  // 50MB
  
  engines: {
    memory: {
      maxSize: 10 * 1024 * 1024,  // 10MB
      maxItems: 1000,
      evictionStrategy: 'LRU',
    },
  },
})
```

### 2. 选择合适的淘汰策略

| 策略 | 适用场景 | 特点 |
|------|----------|------|
| LRU | 通用场景 | 淘汰最久未访问的 |
| LFU | 访问模式稳定 | 淘汰访问频率低的 |
| FIFO | 时间敏感数据 | 淘汰最早添加的 |
| ARC | 不确定场景 | 自适应 LRU/LFU |

```typescript
const cache = createCache({
  engines: {
    memory: {
      evictionStrategy: 'LRU',  // 默认且推荐
    },
  },
})
```

### 3. 定期优化内存

```typescript
// 低频优化（推荐）
setInterval(async () => {
  await cache.optimizeMemory()
}, 60000)  // 每分钟

// 高频场景（高流量应用）
setInterval(async () => {
  await cache.optimizeMemory()
}, 30000)  // 每30秒
```

### 4. 避免存储过大对象

```typescript
// ❌ 不好：存储超大对象
await cache.set('huge-data', {
  items: new Array(100000).fill({ /* 复杂对象 */ })
})

// ✅ 好：分页存储
for (let page = 0; page < 10; page++) {
  await cache.set(`data-page-${page}`, pageData[page])
}

// ✅ 或使用 IndexedDB
await cache.set('huge-data', bigData, { 
  engine: 'indexedDB'  // 自动选择或手动指定
})
```

---

## 🚀 序列化优化

### 1. 简单值优先

v0.2.0 对简单值有快速路径：

```typescript
// ✅ 超快：简单类型（+80% 性能）
await cache.set('name', 'John')
await cache.set('age', 30)
await cache.set('active', true)

// 🐌 较慢：复杂对象
await cache.set('user', { name: 'John', age: 30, ... })
```

### 2. 避免循环引用

```typescript
// ❌ 不好：循环引用（会被处理但性能差）
const obj: any = { name: 'test' }
obj.self = obj
await cache.set('circular', obj)

// ✅ 好：无循环引用
await cache.set('clean', { name: 'test' })
```

### 3. 预序列化大对象

```typescript
// 对于频繁读取的大对象
const serialized = JSON.stringify(largeObject)
await cache.set('large-obj-serialized', serialized)

// 读取时手动解析
const data = await cache.get('large-obj-serialized')
const obj = JSON.parse(data)
```

---

## 🔐 安全最佳实践

### 1. 敏感数据加密

```typescript
await cache.set('credit-card', cardData, {
  encrypt: true,  // 加密存储
  ttl: 5 * 60 * 1000,  // 短 TTL
})
```

### 2. 键名混淆

```typescript
const cache = createCache({
  security: {
    obfuscation: {
      enabled: true,
      algorithm: 'hash',
    },
  },
})
```

### 3. 跨设备同步使用 HTTPS/WSS

```typescript
// ✅ 好：加密连接
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://secure-api.example.com/sync',
  authToken: token,
})

// ❌ 不好：非加密连接
const remoteSync = new RemoteSyncManager({
  serverUrl: 'ws://api.example.com/sync',
})
```

---

## 🎯 使用场景最佳实践

### 场景1: 用户设置缓存

```typescript
// 配置
const cache = createCache({
  defaultEngine: 'localStorage',  // 持久化
  defaultTTL: 30 * 24 * 60 * 60 * 1000,  // 30天
})

// 跨标签页同步
const sync = new SyncManager(cache, {
  conflictResolution: 'last-write-wins',
  batchInterval: 1000,
})

// 使用
await cache.set('user-settings', {
  theme: 'dark',
  language: 'zh-CN',
})
```

### 场景2: API 响应缓存

```typescript
// 配置
const cache = createCache({
  defaultEngine: 'memory',  // 快速访问
  defaultTTL: 5 * 60 * 1000,  // 5分钟
  
  strategy: {
    enabled: true,  // 大数据自动用 IndexedDB
  },
})

// 使用 remember 模式
const apiData = await cache.remember('api-users', async () => {
  const response = await fetch('/api/users')
  return response.json()
}, { ttl: 5 * 60 * 1000 })
```

### 场景3: 表单草稿自动保存

```typescript
import { useCacheValue } from '@ldesign/cache/vue'

// Vue 组件中
const formDraft = useCacheValue('form-draft', {}, {
  autoSave: { 
    debounce: 500,  // 500ms 防抖
    throttle: 2000,  // 2秒节流
  },
})

// 用户输入自动保存
formDraft.value = { title: 'My Post', content: '...' }
```

### 场景4: 大数据集处理

```typescript
// 分页存储
const PAGE_SIZE = 100
for (let page = 0; page < totalPages; page++) {
  await cache.set(`dataset-page-${page}`, pageData[page], {
    engine: 'indexedDB',  // 大数据用 IndexedDB
    ttl: 24 * 60 * 60 * 1000,
  })
}

// 按需加载
const page1 = await cache.get('dataset-page-0')
```

### 场景5: 多设备协同

```typescript
// 本地缓存
const cache = new CacheManager()

// 跨标签页
const localSync = new SyncManager(cache, {
  conflictResolution: 'custom',
  customResolver: mergeDocuments,
})

// 跨设备
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  transport: 'websocket',
})

await remoteSync.connect()

// 双向同步
cache.on('set', (event) => {
  remoteSync.sync(event.key, syncData, 'set')
})

remoteSync.on('message', (message) => {
  cache.set(message.data.key, message.data.syncData.value)
})
```

---

## 🎨 代码模式

### 模式1: 优雅降级

```typescript
import { gracefulDegradation } from '@ldesign/cache'

const userData = await gracefulDegradation(
  // 主要：从缓存获取
  () => cache.get('user-data'),
  [
    // 降级1：从 API 获取
    () => fetchUserFromAPI(),
    // 降级2：使用默认值
    () => getDefaultUser(),
  ]
)
```

### 模式2: 错误处理

```typescript
import { ErrorAggregator, CacheErrorCode } from '@ldesign/cache'

const errorAgg = new ErrorAggregator()

try {
  await cache.set('key', value)
}
catch (error) {
  errorAgg.add(error, { operation: 'set', key: 'key' })
  
  // 根据错误码决定处理方式
  if (error.code === CacheErrorCode.STORAGE_QUOTA_EXCEEDED) {
    // 清理空间
    await cache.cleanup()
    await cache.optimizeMemory()
    // 重试
    await cache.set('key', value)
  }
}
```

### 模式3: 记忆函数

```typescript
// 缓存昂贵的计算
async function getExpensiveData(id: string) {
  return cache.remember(`expensive-${id}`, async () => {
    // 昂贵的计算或 API 调用
    return await computeExpensiveData(id)
  }, { ttl: 10 * 60 * 1000 })  // 10分钟
}
```

### 模式4: Delta 同步

```typescript
import { withDeltaSync, DeltaSync } from '@ldesign/cache'

const deltaCache = withDeltaSync(cache)

// 自动使用 Delta（如果值得）
await deltaCache.deltaSet('document', largeDocument)

// 手动检查
if (DeltaSync.shouldUseDelta(oldDoc, newDoc)) {
  const delta = DeltaSync.diff(oldDoc, newDoc)
  await cache.set('doc-delta', delta.changes)
  // 节省 60-70% 空间
}
```

---

## 📊 监控和调试

### 开发环境调试

```typescript
if (process.env.NODE_ENV === 'development') {
  // 安装 DevTools
  installDevTools(cache)
  
  // 定期输出健康报告
  setInterval(async () => {
    const report = await __CACHE_DEVTOOLS__.report()
    console.log(report)
  }, 60000)
}
```

### 生产环境监控

```typescript
// 监控关键指标
setInterval(async () => {
  const stats = await cache.getStats()
  
  // 上报到监控系统
  sendMetrics({
    totalItems: stats.totalItems,
    totalSize: stats.totalSize,
    hitRate: stats.hitRate,
  })
  
  // 告警阈值
  if (stats.hitRate < 0.5) {
    alert('缓存命中率过低')
  }
}, 300000)  // 每5分钟
```

### 性能分析

```typescript
const profiler = createPerformanceProfiler(cache, {
  slowThreshold: 100,  // 100ms 视为慢操作
  samplingRate: 0.1,   // 10% 采样
})

// 测量关键操作
await profiler.measure('load-user', async () => {
  return cache.get('user-data')
})

// 定期生成报告
setInterval(() => {
  const analysis = profiler.analyze()
  console.log('P95:', analysis.p95Duration)
  
  if (analysis.p95Duration > 200) {
    console.warn('性能下降，需要优化')
  }
}, 600000)  // 每10分钟
```

---

## 🚫 反模式（避免）

### 1. 过度缓存

```typescript
// ❌ 不好：缓存所有数据
await cache.set('random-uuid', uuid())
await cache.set('current-time', Date.now())

// ✅ 好：只缓存有价值的数据
await cache.set('user-profile', userProfile, { ttl: 3600000 })
await cache.set('api-config', config, { ttl: 86400000 })
```

### 2. 忽略 TTL

```typescript
// ❌ 不好：永久缓存
await cache.set('user-data', data)

// ✅ 好：设置合理的 TTL
await cache.set('user-data', data, { ttl: 24 * 60 * 60 * 1000 })
```

### 3. 同步所有数据

```typescript
// ❌ 不好：同步所有引擎
const sync = new SyncManager(cache, {
  engines: ['memory', 'localStorage', 'sessionStorage', 'indexedDB'],
})

// ✅ 好：只同步需要共享的
const sync = new SyncManager(cache, {
  engines: ['localStorage'],  // 只同步持久化数据
})
```

### 4. 忽略错误

```typescript
// ❌ 不好：忽略错误
await cache.set('key', 'value').catch(() => {})

// ✅ 好：处理错误
try {
  await cache.set('key', 'value')
}
catch (error) {
  if (error.code === CacheErrorCode.STORAGE_QUOTA_EXCEEDED) {
    await cache.cleanup()
    // 重试或通知用户
  }
}
```

### 5. 频繁的完整快照

```typescript
// ❌ 不好：每次都创建完整快照
setInterval(async () => {
  await snapshotMgr.create()
}, 60000)

// ✅ 好：使用增量快照
const stop = snapshotMgr.autoSnapshot(
  {},
  60000,  // 每分钟
  true    // 使用增量
)

// 定期压缩历史
setInterval(async () => {
  await snapshotMgr.compressHistory()
}, 3600000)  // 每小时
```

---

## 📈 性能基准

### 测试环境

- CPU: Intel i7-9700K
- RAM: 16GB
- Browser: Chrome 120
- OS: Windows 11

### 实际性能数据

```typescript
// 简单值 get/set（10000次）
// v0.1.x: ~1000ms
// v0.2.0: ~800ms
// 提升: 20%

// 批量操作（100项）
// v0.1.x: ~150ms
// v0.2.0: ~50ms  
// 提升: 66%

// 缓存命中 get（10000次）
// v0.1.x: ~1500ms
// v0.2.0: ~500ms
// 提升: 66%
```

### 内存占用

```typescript
// 10000个缓存项
// v0.1.x: ~8MB
// v0.2.0: ~6MB
// 减少: 25%
```

---

## 🎓 学习路径

### 新手

1. 阅读 [README.md](../README.md) - 了解基础功能
2. 运行 [examples](../examples) - 实践示例代码
3. 使用基础 API - set/get/remove/clear

### 进阶

1. 阅读 [cross-tab-sync.md](./cross-tab-sync.md) - 跨标签页同步
2. 使用批量操作 - mset/mget 提升性能
3. 配置智能策略 - 自动选择最优引擎

### 高级

1. 阅读 [cross-device-sync.md](./cross-device-sync.md) - 跨设备同步
2. 使用 Delta 同步 - 优化大对象
3. 自定义冲突解决 - 复杂协同场景
4. 使用 DevTools - 性能调优

---

## 🔍 性能调优检查清单

### 启动时

- [ ] 设置合理的 `maxMemory` 限制
- [ ] 配置 `cleanupInterval` 自动清理
- [ ] 启用智能策略（默认启用）
- [ ] 选择合适的默认引擎

### 运行时

- [ ] 使用批量操作处理多个项
- [ ] 为所有数据设置合理的 TTL
- [ ] 定期调用 `optimizeMemory()`
- [ ] 监控缓存命中率

### 同步场景

- [ ] 选择合适的冲突解决策略
- [ ] 启用批量同步（`batchInterval`）
- [ ] 启用离线队列
- [ ] 监控同步状态

### 调试优化

- [ ] 开发环境启用 DevTools
- [ ] 定期查看健康报告
- [ ] 识别热点键和大数据项
- [ ] 使用性能分析器找出瓶颈

---

## 💡 专家建议

### 1. 分层缓存策略

```typescript
// 三层缓存：内存 -> localStorage -> API
async function getData(key: string) {
  // L1: 内存（最快）
  let value = await cache.get(key)
  if (value) return value
  
  // L2: localStorage（次快）
  value = await cache.get(key, { engine: 'localStorage' })
  if (value) {
    // 回填到内存
    await cache.set(key, value, { engine: 'memory' })
    return value
  }
  
  // L3: API（最慢）
  value = await fetchFromAPI(key)
  await cache.set(key, value, { ttl: 300000 })
  return value
}
```

### 2. 自适应 TTL

```typescript
// 根据访问频率调整 TTL
async function setWithAdaptiveTTL(key: string, value: any) {
  const metadata = await cache.getMetadata(key)
  
  // 高频访问 -> 长 TTL
  const accessCount = metadata?.accessCount || 0
  const ttl = accessCount > 100 
    ? 24 * 60 * 60 * 1000  // 24小时
    : 60 * 60 * 1000       // 1小时
  
  await cache.set(key, value, { ttl })
}
```

### 3. 预热关键数据

```typescript
// 应用启动时预热
async function warmupCache() {
  const criticalKeys = ['user-profile', 'app-config', 'permissions']
  
  await Promise.all(
    criticalKeys.map(async (key) => {
      const value = await cache.get(key)
      if (!value) {
        const data = await fetchData(key)
        await cache.set(key, data)
      }
    })
  )
}

// 启动时调用
await warmupCache()
```

---

## 📖 延伸阅读

- [优化报告](../FINAL_OPTIMIZATION_REPORT.md) - 详细技术分析
- [升级指南](../UPGRADE_GUIDE.md) - 版本迁移
- [API 参考](./api) - 完整 API 文档
- [示例代码](../examples) - 实际使用示例

---

**记住**: 最好的优化是写出简洁、易读的代码。过早优化是万恶之源！

