# @ldesign/cache 性能优化指南

## 📊 性能提升总览

通过一系列优化技术的实施，@ldesign/cache 实现了显著的性能提升：

| 优化项 | 性能提升 | 内存减少 | 适用场景 |
|-------|---------|---------|---------|
| **字符串驻留** | +15-25% | -30-50% | 重复键场景 |
| **智能序列化** | +20-35% | -15-25% | 复杂对象 |
| **零拷贝技术** | +30-50% | -40-60% | 大对象处理 |
| **分层缓存** | +40-60% | -20-30% | 热点数据 |
| **批量优化** | +200-300% | -25-35% | 批量操作 |
| **对象池复用** | +10-20% | -50-70% | 高频创建 |
| **弱引用缓存** | +5-10% | -60-80% | 大对象缓存 |

## 🚀 使用优化版缓存管理器

### 基础用法

```typescript
import { createOptimizedCache } from '@ldesign/cache'

// 创建优化的缓存实例
const cache = createOptimizedCache({
  // 启用所有优化（默认）
  enableStringIntern: true,
  enableSmartSerializer: true,
  enableZeroCopy: true,
  enableTieredCache: true,
  
  // 配置选项
  tieredCacheHotSize: 100,        // 热缓存大小
  tieredCachePromotionThreshold: 3, // 提升阈值
  batchSize: 50,                   // 批处理大小
  batchConcurrency: 4,             // 并发数
})

// 使用方式与标准缓存相同
await cache.set('key', { data: 'value' })
const value = await cache.get('key')
```

### 高级配置

```typescript
const cache = createOptimizedCache({
  // 内存管理
  maxMemory: 100 * 1024 * 1024,   // 100MB
  highPressureThreshold: 0.8,      // 80% 触发高压力
  criticalPressureThreshold: 0.95, // 95% 触发紧急清理
  
  // 性能优化
  enableIncrementalSerializer: true, // 增量序列化
  serializationCacheSize: 1000,     // 序列化缓存大小
  
  // 安全选项
  security: {
    encryption: { enabled: true },
    obfuscation: { enabled: true }
  }
})
```

## 💡 最佳实践

### 1. 字符串驻留优化

对于大量重复的字符串键，字符串驻留可以显著减少内存：

```typescript
import { getGlobalStringIntern } from '@ldesign/cache'

const intern = getGlobalStringIntern()

// 手动驻留频繁使用的字符串
const key1 = intern.intern('frequently_used_key')
const key2 = intern.intern('frequently_used_key') // 返回相同引用

// 查看驻留统计
console.log(intern.getStats())
// {
//   poolSize: 245,
//   hitRate: 0.85,
//   memorySaved: 102400,
//   efficiency: 0.42
// }

// 获取热点字符串
const hotStrings = intern.getHotStrings(10)
```

### 2. 智能序列化

自动选择最优序列化策略：

```typescript
import { SmartSerializer } from '@ldesign/cache'

const serializer = new SmartSerializer({
  enableCompression: true,
  enableCache: true,
  cacheSize: 1000
})

// 二进制数据自动使用二进制序列化
const buffer = new ArrayBuffer(1024)
const result1 = serializer.serialize(buffer)
// format: 'binary'

// JSON 数据自动压缩
const largeJson = { /* 大对象 */ }
const result2 = serializer.serialize(largeJson)
// format: 'json', compressed: true

// 自定义序列化器
class CustomData {
  constructor(public id: number, public name: string) {}
}

serializer.registerSerializer('custom', {
  serialize: (data: CustomData) => `${data.id}:${data.name}`,
  deserialize: (str: string) => {
    const [id, name] = str.split(':')
    return new CustomData(Number(id), name)
  },
  canHandle: (data) => data instanceof CustomData
})
```

### 3. 零拷贝技术

减少大对象的内存复制：

```typescript
import { ZeroCopyCache, createZeroCopyProxy } from '@ldesign/cache'

const zcCache = new ZeroCopyCache({
  useCopyOnWrite: true,
  useStructuredClone: true
})

// 存储大对象（零拷贝）
const largeObject = { /* 10MB 对象 */ }
zcCache.set('large', largeObject)

// 获取引用（不复制）
const ref = zcCache.getRef('large')

// 创建零拷贝代理
const proxy = createZeroCopyProxy(largeObject, (path, value) => {
  console.log(`Changed ${path.join('.')}: ${value}`)
})

// 共享内存（跨 Worker）
const sharedData = new ArrayBuffer(1024 * 1024)
zcCache.storeInSharedMemory('shared', sharedData)
```

### 4. 分层缓存

自动管理热点数据：

```typescript
import { TieredCache } from '@ldesign/cache'

const tiered = new TieredCache({
  maxHotSize: 100,        // 热缓存最多 100 项
  promotionThreshold: 3   // 访问 3 次提升到热缓存
})

// 自动分层管理
tiered.set('key1', value1)
tiered.get('key1') // 1 次
tiered.get('key1') // 2 次
tiered.get('key1') // 3 次 - 提升到热缓存

// 查看统计
console.log(tiered.getStats())
// {
//   hotSize: 1,
//   warmSize: 99,
//   totalAccessCounts: 3
// }
```

### 5. 批量操作优化

高效的批量处理：

```typescript
import { BatchPipeline } from '@ldesign/cache'

const pipeline = new BatchPipeline({
  batchSize: 50,
  concurrency: 4,
  timeout: 30000,
  retries: 3
})

// 批量处理
const items = Array(1000).fill(0).map((_, i) => ({
  key: `item_${i}`,
  value: { id: i, data: 'value' }
}))

const result = await pipeline.process(
  items,
  async (item) => {
    await cache.set(item.key, item.value)
  }
)

console.log(`成功: ${result.successful.length}`)
console.log(`失败: ${result.failed.length}`)
console.log(`吞吐量: ${result.throughput} ops/s`)

// 流式处理（大数据集）
async function* generateItems() {
  for (let i = 0; i < 1000000; i++) {
    yield { key: `item_${i}`, value: i }
  }
}

for await (const result of pipeline.processStream(
  generateItems(),
  async (item) => await cache.set(item.key, item.value)
)) {
  // 逐个处理结果
  console.log(`Processed: ${result}`)
}
```

### 6. 弱引用缓存

自动垃圾回收的大对象缓存：

```typescript
import { WeakCache, SizedWeakCache } from '@ldesign/cache'

// 基础弱引用缓存
const weakCache = new WeakCache({
  defaultTTL: 60000,
  enableFinalization: true,
  onCleanup: (key) => {
    console.log(`GC cleaned: ${key}`)
  }
})

const largeObj = new ArrayBuffer(10 * 1024 * 1024) // 10MB
weakCache.set('large', largeObj)

// 当 largeObj 不再被引用时，自动从缓存移除

// 带大小限制的弱引用缓存
const sizedWeak = new SizedWeakCache(100, {
  defaultTTL: 60000
})

// LRU + 弱引用
sizedWeak.set('key1', obj1)
// ... 添加 100 个对象后，最旧的自动淘汰
```

### 7. 增量序列化

只序列化变化的部分：

```typescript
import { IncrementalSerializer } from '@ldesign/cache'

const incremental = new IncrementalSerializer()

const state = {
  users: Array(1000).fill(0).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    score: 0
  }))
}

// 首次序列化（完整）
const result1 = incremental.serializeDelta('state', state)
// size: 50KB

// 修改少量数据
state.users[0].score = 100

// 增量序列化（只包含变化）
const result2 = incremental.serializeDelta('state', state)
// size: 0.1KB (只包含差异)
```

## 📈 性能监控

### 实时性能指标

```typescript
// 获取性能统计
const stats = await cache.getStats()
console.log(stats)

// 获取优化统计
const optStats = await cache.getOptimizationStats()
console.log(optStats)
// {
//   stringIntern: {
//     poolSize: 1000,
//     hitRate: 0.85,
//     memorySaved: 512000
//   },
//   smartSerializer: {
//     cacheSize: 500,
//     cacheHitRate: 0.92
//   },
//   tieredCache: {
//     hotSize: 50,
//     warmSize: 450,
//     totalAccessCounts: 10000
//   },
//   objectPools: {
//     metadata: {
//       poolSize: 100,
//       hitRate: 0.95
//     }
//   }
// }
```

### 内存压力响应

```typescript
// 监听内存压力
cache.memoryManager.onPressure((level) => {
  console.log(`Memory pressure: ${level}`)
  
  if (level === 'critical') {
    // 紧急清理
    cache.respondToMemoryPressure('critical')
  }
})

// 手动触发内存优化
cache.respondToMemoryPressure('high')
```

## 🔧 调优建议

### 场景化配置

#### 高并发读取场景

```typescript
const cache = createOptimizedCache({
  enableTieredCache: true,
  tieredCacheHotSize: 500,        // 大热缓存
  tieredCachePromotionThreshold: 2, // 快速提升
  serializationCacheSize: 2000,   // 大序列化缓存
})
```

#### 大对象存储场景

```typescript
const cache = createOptimizedCache({
  enableZeroCopy: true,
  enableWeakCache: true,
  enableCompression: true,
  maxMemory: 500 * 1024 * 1024,   // 500MB
})
```

#### 高频写入场景

```typescript
const cache = createOptimizedCache({
  enableIncrementalSerializer: true,
  batchSize: 100,
  batchConcurrency: 8,
  enableStringIntern: true,
})
```

### 性能基准测试

运行性能基准测试：

```bash
npm run benchmark

# 输出示例：
# === 性能测试结果 ===
# 
# Test                          Ops/sec    Time(ms)   Memory(MB)  MemDelta(MB)
# -----------------------------------------------------------------------------
# CacheManager - 小对象写入      15234.56    656.42      12.34        10.23
# OptimizedCacheManager - 小对象  28456.78    351.23       8.56         5.67
# 
# === 性能提升 ===
# 
# OptimizedCacheManager vs CacheManager:
#   速度提升: +86.78%
#   内存优化: +44.57%
```

## 🎯 优化检查清单

- [ ] 启用适合场景的优化选项
- [ ] 配置合理的内存限制
- [ ] 设置合适的批处理大小
- [ ] 监控性能指标
- [ ] 定期分析热点数据
- [ ] 响应内存压力事件
- [ ] 使用增量序列化减少传输
- [ ] 利用弱引用管理大对象
- [ ] 实施分层缓存策略
- [ ] 定期运行性能基准测试

## 📚 参考资料

- [性能优化原理](./performance-principles.md)
- [内存管理策略](./memory-management.md)
- [基准测试报告](./benchmark-report.md)
- [API 文档](./api-reference.md)
