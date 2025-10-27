# @ldesign/cache v0.3.0 快速参考

> 快速查找新功能和优化的使用方法

---

## 🎯 核心改进

### 1. 性能提升

```typescript
// ✅ 序列化速度提升 60-80% (基本类型)
await cache.set('key', 'simple string')  // 超快！
await cache.set('key', 12345)            // 超快！
await cache.set('key', true)             // 超快！

// ✅ 批量操作提升 40-60%
await cache.mset([
  { key: 'k1', value: 'v1' },
  { key: 'k2', value: 'v2' },
  // ... 100项在120ms内完成
])

// ✅ 内存占用降低 30-40%
// 自动使用对象池、环形缓冲区等优化
```

---

## 🆕 新功能速查

### 链式API构建器

```typescript
import { CacheBuilder, CachePresets } from '@ldesign/cache'

// 方式1：链式构建
const cache = new CacheBuilder()
  .withEngine('indexedDB')
  .withTTL(24 * 60 * 60 * 1000)
  .withEncryption('my-secret-key')
  .withKeyPrefix('app')
  .withSmartStrategy()
  .enablePrefetch()
  .enableDebug()
  .build()

// 方式2：预设配置
const browserCache = CachePresets.browser()      // 浏览器标准配置
const secureCache = CachePresets.secure()        // 安全加密配置
const memoryCache = CachePresets.memory()        // 纯内存配置
const highPerfCache = CachePresets.highPerformance() // 高性能配置
const largeDataCache = CachePresets.largeData()  // 大数据配置
```

---

### 装饰器

```typescript
import { Cached, CachedProperty, CacheEvict } from '@ldesign/cache'

class UserService {
  // 缓存方法返回值
  @Cached({ ttl: 5 * 60 * 1000 })
  async getUser(id: string): Promise<User> {
    return await api.get(`/users/${id}`)
  }
  
  // 缓存getter
  @CachedProperty({ ttl: 60 * 1000 })
  get config(): Config {
    return this.expensiveComputation()
  }
  
  // 更新时清除缓存
  @CacheEvict(['UserService.getUser*'])
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return await api.put(`/users/${id}`, data)
  }
}
```

---

### 性能监控

```typescript
// 启用性能跟踪
cache.enablePerformanceTracking()

// 获取性能指标
const metrics = cache.getPerformanceMetrics()
console.log('GET平均耗时:', metrics.operations.get.avgTime)
console.log('GET P95:', metrics.operations.get.p95)
console.log('内存使用:', metrics.memory.current)
console.log('热点键:', metrics.hotKeys)

// 生成性能报告
console.log(cache.generatePerformanceReport())

// 输出示例：
// ============================================================
// 📊 缓存性能报告
// ============================================================
// 
// ⚡ 操作性能:
//   GET:    1000 次, 平均 2.50ms, P95 5.20ms
//   SET:    800 次, 平均 3.10ms, P95 6.80ms
//   REMOVE: 100 次, 平均 1.80ms
// 
// 🔧 引擎性能:
//   memory:
//     读: 800 次, 平均 0.50ms
//     写: 600 次, 平均 0.80ms
//   localStorage:
//     读: 200 次, 平均 2.00ms
//     写: 200 次, 平均 3.50ms
// 
// 💾 内存使用:
//   当前: 3.50 MB
//   峰值: 4.20 MB
//   限制: 100.00 MB
//   使用率: 3.5%
//   压力: low
// 
// 🔥 热点键 Top 5:
//   1. user:profile: 500 次访问
//   2. config:app: 300 次访问
//   3. user:settings: 250 次访问
```

---

### 高级DevTools

```typescript
import { installDevTools } from '@ldesign/cache'

// 安装开发工具（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  installDevTools(cache)
}

// 浏览器控制台使用：
__CACHE_DEVTOOLS__.dashboard()     // 📊 实时仪表板
__CACHE_DEVTOOLS__.analyze()       // 💡 优化建议
__CACHE_DEVTOOLS__.memory()        // 💾 内存分析
__CACHE_DEVTOOLS__.performance()   // ⚡ 性能指标
__CACHE_DEVTOOLS__.healthReport()  // 🏥 健康报告

// 示例输出：
// 💡 优化建议
// ⚠️ 缓存命中率低于50% (45.2%)，考虑调整TTL或预热策略
//    建议: 增加TTL时长或使用预热策略
// ℹ️ 检测到1个热点键，考虑使用内存引擎或增加副本
//    建议: 将热点数据迁移到memory引擎
```

---

### 智能预测缓存

```typescript
import { PredictiveCache } from '@ldesign/cache'

const predictor = new PredictiveCache({
  historySize: 10000,       // 保留10000条访问历史
  associationWindow: 5000,  // 5秒关联窗口
  minConfidence: 0.3,       // 最小置信度30%
})

// 记录访问
predictor.recordAccess('user:list')
predictor.recordAccess('user:1')
predictor.recordAccess('user:2')

// 预测下一步可能访问的键
const nextKeys = predictor.predictNext('user:list', 3)
// ['user:1', 'user:2', 'user:3']

// 时间模式预测
const prediction = predictor.predictByTimePattern('user:list')
if (prediction.shouldPrefetch && prediction.confidence > 0.7) {
  // 执行预取
  for (const key of nextKeys) {
    cache.get(key).catch(console.warn)
  }
}

// 获取关联规则
const rules = predictor.getAssociationRules('user:list', 0.5)
rules.forEach(rule => {
  console.log(`${rule.antecedent} → ${rule.consequent}`)
  console.log(`  置信度: ${(rule.confidence * 100).toFixed(1)}%`)
  console.log(`  提升度: ${rule.lift.toFixed(2)}`)
})
```

---

### OPFS存储引擎

```typescript
import { OPFSEngine } from '@ldesign/cache'

// 创建OPFS引擎
const opfsEngine = new OPFSEngine({
  directoryName: 'my-app-cache',
  maxSize: 2 * 1024 * 1024 * 1024, // 2GB
})

// 使用OPFS引擎的缓存
const cache = new CacheBuilder()
  .withEngine('opfs')
  .build()

// 适合超大数据
await cache.set('large-dataset', hugeData)  // 自动使用OPFS

// 特点：
// ✅ 容量大（几GB）
// ✅ 持久化
// ✅ 高性能
// ⚠️ 需要HTTPS
// ⚠️ 需要浏览器支持（Chrome 86+, Safari 15.2+）
```

---

### 自适应策略

```typescript
import { AdaptiveStorageStrategy } from '@ldesign/cache'

const adaptiveStrategy = new AdaptiveStorageStrategy({
  learningPeriod: 100,      // 学习期：前100次访问
  switchThreshold: 0.9,     // 切换阈值：90%置信度
  performanceWindow: 50,    // 性能评估窗口
})

// 策略会自动学习和优化
const recommendation = await adaptiveStrategy.selectEngine(
  'user:123',
  userData,
  { ttl: 3600000 }
)

console.log(recommendation)
// {
//   engine: 'memory',
//   reason: '小数据, 短TTL, 高频访问',
//   confidence: 0.95
// }

// 获取统计
const stats = adaptiveStrategy.getStats()
console.log('学习的模式数:', stats.totalPatterns)
console.log('引擎性能:', stats.enginePerformance)
```

---

### 插件系统

```typescript
import { createLoggingPlugin, createStatsPlugin } from '@ldesign/cache'

// 使用内置插件
const cache = new CacheManager()
  .use(createLoggingPlugin({ logLevel: 'debug' }))
  .use(createStatsPlugin())

// 自定义插件
const customPlugin: CachePlugin = {
  name: 'custom-plugin',
  version: '1.0.0',
  
  onInit: async (cache) => {
    console.log('Cache initialized')
  },
  
  onSet: async (event) => {
    console.log(`SET: ${event.key}`)
    // 发送到分析系统
    analytics.track('cache_set', { key: event.key })
  },
  
  onError: async (event) => {
    // 错误上报
    errorReporting.log(event.error)
  },
}

cache.use(customPlugin)

// 管理插件
cache.getPlugins()               // 获取已注册插件
cache.unregisterPlugin('custom-plugin')  // 注销插件
```

---

### 测试工具

```typescript
import { CacheTestHelper, MockStorageEngine, CacheBenchmark } 
  from '@ldesign/cache/testing'

describe('Cache Tests', () => {
  it('should work', async () => {
    // 创建测试缓存
    const cache = CacheTestHelper.createTestCache()
    
    // 填充测试数据
    const keys = await CacheTestHelper.seedCache(cache, 100, {
      keyPrefix: 'test',
      valueSize: 1024,
    })
    
    // 等待条件
    await CacheTestHelper.waitFor(
      async () => (await cache.get('test-0')) !== null,
      5000
    )
    
    // 断言状态
    await CacheTestHelper.assertCacheState(cache, {
      totalItems: 100,
      hitRate: { min: 0.8 },
    })
    
    // 快照对比
    const snap1 = await CacheTestHelper.createSnapshot(cache)
    await cache.set('new-key', 'value')
    const snap2 = await CacheTestHelper.createSnapshot(cache)
    
    const diff = CacheTestHelper.compareSnapshots(snap1, snap2)
    console.log('新增键:', diff.newKeys)
  })
  
  it('should benchmark', async () => {
    // 性能测量
    const result = await CacheBenchmark.measure(
      async () => await cache.get('key'),
      1000
    )
    
    console.log('平均耗时:', result.avgTime)
    console.log('P95:', result.p95)
    
    // 性能对比
    const comparison = await CacheBenchmark.compare(
      async () => oldImplementation(),
      async () => newImplementation(),
      100
    )
    
    console.log('性能提升:', comparison.improvement)
  })
})
```

---

## 🔍 调试技巧

### 1. 查看内部状态

```typescript
// 获取统计信息
const stats = await cache.getStats()
console.table(stats.engines)

// 获取性能指标
const perf = cache.getPerformanceMetrics()
console.table({
  GET: perf.operations.get,
  SET: perf.operations.set,
})

// 查看热点键
console.table(perf.hotKeys)
```

### 2. 监控内存使用

```typescript
// 内存详情
__CACHE_DEVTOOLS__.memory()

// 输出：
// 📊 内存使用分布:
// 
// memory         ████████████████░░░░░░░░░░░░░░░░░░░░ 2.50 MB (71.4%)
// localStorage   ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.80 MB (22.9%)
// indexedDB      ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0.20 MB (5.7%)
// 
// 总计: 3.50 MB
```

### 3. 获取优化建议

```typescript
__CACHE_DEVTOOLS__.analyze()

// 输出：
// 💡 优化建议
// ⚠️ 缓存命中率低于50% (45.2%)，考虑调整TTL或预热策略
//    建议: 增加TTL时长或使用预热策略
// ℹ️ 检测到1个热点键，考虑使用内存引擎或增加副本
//    建议: 将热点数据迁移到memory引擎
```

---

## 📖 API速查表

### CacheBuilder API

| 方法 | 说明 | 示例 |
|------|------|------|
| `withEngine(engine)` | 设置默认引擎 | `.withEngine('localStorage')` |
| `withTTL(ms)` | 设置默认TTL | `.withTTL(3600000)` |
| `withEncryption(key?)` | 启用加密 | `.withEncryption('secret')` |
| `withObfuscation(prefix?, algo?)` | 启用混淆 | `.withObfuscation('app', 'hash')` |
| `withKeyPrefix(prefix)` | 设置键前缀 | `.withKeyPrefix('myapp')` |
| `withSmartStrategy(config?)` | 启用智能策略 | `.withSmartStrategy()` |
| `withMaxMemory(bytes)` | 设置内存限制 | `.withMaxMemory(100*1024*1024)` |
| `enableDebug()` | 启用调试 | `.enableDebug()` |
| `enablePrefetch(config?)` | 启用预取 | `.enablePrefetch()` |
| `build()` | 构建实例 | `.build()` |

### CacheManager新增API

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `getPerformanceMetrics()` | 获取性能指标 | `PerformanceMetrics` |
| `generatePerformanceReport()` | 生成性能报告 | `string` |
| `enablePerformanceTracking()` | 启用性能跟踪 | `void` |
| `disablePerformanceTracking()` | 禁用性能跟踪 | `void` |
| `use(plugin)` | 注册插件 | `this` (链式) |
| `unregisterPlugin(name)` | 注销插件 | `boolean` |
| `getPlugins()` | 获取插件列表 | `Array<{name, version}>` |

### DevTools API

| 方法 | 说明 |
|------|------|
| `__CACHE_DEVTOOLS__.dashboard()` | 实时监控仪表板 |
| `__CACHE_DEVTOOLS__.analyze()` | 自动优化建议 |
| `__CACHE_DEVTOOLS__.memory()` | 内存使用分析 |
| `__CACHE_DEVTOOLS__.performance()` | 性能指标 |
| `__CACHE_DEVTOOLS__.healthReport()` | 完整健康报告 |
| `__CACHE_DEVTOOLS__.stats()` | 统计信息 |
| `__CACHE_DEVTOOLS__.items()` | 所有缓存项 |
| `__CACHE_DEVTOOLS__.search(pattern)` | 搜索缓存项 |
| `__CACHE_DEVTOOLS__.health()` | 引擎健康状态 |
| `__CACHE_DEVTOOLS__.hotKeys(n)` | 热点键Top N |

---

## ⚡ 性能优化建议

### 1. 选择合适的引擎

```typescript
// ✅ 高频小数据 → memory
await cache.set('counter', count, { engine: 'memory' })

// ✅ 中等持久数据 → localStorage
await cache.set('user-profile', profile, { engine: 'localStorage' })

// ✅ 大数据 → indexedDB
await cache.set('dataset', largeData, { engine: 'indexedDB' })

// ✅ 超大数据 → opfs
await cache.set('huge-file', hugeData, { engine: 'opfs' })

// 或者让智能策略自动选择
const cache = new CacheBuilder()
  .withSmartStrategy()
  .build()
```

### 2. 使用批量操作

```typescript
// ❌ 不推荐：循环调用
for (const item of items) {
  await cache.set(item.key, item.value)
}

// ✅ 推荐：批量操作
await cache.mset(items.map(item => ({
  key: item.key,
  value: item.value,
})))
```

### 3. 启用性能跟踪

```typescript
// 开发环境启用
if (isDev) {
  cache.enablePerformanceTracking()
  
  // 定期检查
  setInterval(() => {
    const metrics = cache.getPerformanceMetrics()
    if (metrics.operations.get.p95 > 100) {
      console.warn('GET操作P95过高')
    }
  }, 60000)
}
```

### 4. 监控内存压力

```typescript
// 监听内存警告
const metrics = cache.getPerformanceMetrics()
if (metrics.memory.pressure === 'high') {
  console.warn('内存压力偏高，执行清理')
  await cache.cleanup()
}

// 或使用插件自动处理
const memoryPlugin: CachePlugin = {
  name: 'memory-watcher',
  version: '1.0.0',
  
  onSet: async () => {
    const metrics = cache.getPerformanceMetrics()
    if (metrics.memory.pressure === 'critical') {
      await cache.cleanup()
    }
  },
}

cache.use(memoryPlugin)
```

---

## 🎨 最佳实践

### 1. 使用装饰器简化缓存逻辑

```typescript
// ✅ 推荐
class API {
  @Cached({ ttl: 5 * 60 * 1000 })
  async getData(id: string) {
    return await fetch(`/api/data/${id}`)
  }
}

// ❌ 不推荐：手动管理
class API {
  async getData(id: string) {
    const cached = await cache.get(`data:${id}`)
    if (cached) return cached
    
    const data = await fetch(`/api/data/${id}`)
    await cache.set(`data:${id}`, data, { ttl: 5 * 60 * 1000 })
    return data
  }
}
```

### 2. 使用预设配置

```typescript
// ✅ 推荐：使用预设
const cache = CachePresets.browser()

// ❌ 不推荐：手动配置（除非有特殊需求）
const cache = new CacheManager({
  defaultEngine: 'localStorage',
  defaultTTL: 24 * 60 * 60 * 1000,
  strategy: { enabled: true },
  // ... 很多配置
})
```

### 3. 安装开发工具

```typescript
// ✅ 总是在开发环境安装
if (process.env.NODE_ENV === 'development') {
  installDevTools(cache)
  cache.enablePerformanceTracking()
}
```

### 4. 使用插件扩展功能

```typescript
// ✅ 使用插件而不是修改核心代码
const analyticsPlugin: CachePlugin = {
  name: 'analytics',
  version: '1.0.0',
  
  onSet: async (event) => {
    analytics.track('cache_write', {
      key: event.key,
      engine: event.engine,
    })
  },
}

cache.use(analyticsPlugin)
```

---

## 🚨 注意事项

### 1. OPFS引擎限制

- 仅在HTTPS环境可用
- 需要现代浏览器支持
- 异步初始化（第一次操作可能较慢）

### 2. 性能跟踪开销

- 启用后有1-2%的性能开销
- 仅在开发环境启用
- 生产环境建议禁用

### 3. 智能预测

- 需要一定的访问量才能准确预测（建议100+次）
- 预取会占用额外内存和网络
- 根据实际场景调整置信度阈值

### 4. 对象池

- 已自动集成到MemoryEngine
- 无需手动管理
- 适合高频创建/删除场景

---

## 📚 更多资源

- [完整文档](./README.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [升级指南](./UPGRADE_GUIDE.md)
- [API文档](./docs)
- [示例代码](./examples)

---

<div align="center">

**@ldesign/cache v0.3.0 - 更快、更智能、更强大**

[GitHub](https://github.com/ldesign/ldesign) • [NPM](https://www.npmjs.com/package/@ldesign/cache)

</div>

