# @ldesign/cache-core

`@ldesign/cache-core` 是缓存能力的唯一实现层，包含：策略缓存、元信息索引、失效能力、查询增强（去重/SWR/prefetch）、插件钩子与 Engine 插件。

## 安装

```bash
pnpm add @ldesign/cache-core
```

## 快速开始

```ts
import { CacheManager, CacheStrategy } from '@ldesign/cache-core'

const cache = new CacheManager({
  strategy: CacheStrategy.LRU,
  maxSize: 200,
  defaultTTL: 10_000,
  enableStats: true,
  namespace: '业务默认命名空间',
})

cache.set('user:1', { id: 1, name: '张三' }, {
  tags: ['user', 'profile'],
  namespace: '用户模块',
  priority: 8,
})

const user = cache.get('user:1')
const stats = cache.getStats()
```

## 核心能力

### 1. 元信息写入与读取

```ts
cache.set('article:100', { title: '重构说明' }, {
  ttl: 30_000,
  tags: ['article', 'cms'],
  namespace: '内容中心',
  priority: 6,
})

const item = cache.getItem('article:100')
// item?.tags / item?.namespace / item?.priority
```

### 2. 失效能力

```ts
cache.invalidateByTag('cms')
cache.invalidateByNamespace('内容中心')
cache.invalidateWhere(item => (item.priority ?? 0) < 3)
```

### 3. 批量能力

```ts
cache.mset([
  ['k1', 'v1'],
  ['k2', 'v2'],
], {
  tags: ['batch'],
  namespace: '批量任务',
  ttl: 5000,
})

const data = cache.mget(['k1', 'k2'])
cache.mdel(['k1'])
```

### 4. 查询增强（去重 / SWR / 预取）

```ts
const query = cache.query

const result = await query.fetch({
  key: 'api:user:1',
  fetcher: () => fetch('/api/user/1').then(r => r.json()),
  dedupe: true,
  swr: true,
  staleTime: 2000,
  ttl: 30_000,
  tags: ['api', 'user'],
  namespace: '查询层',
})

await query.prefetch({
  key: 'api:user:list',
  fetcher: () => fetch('/api/users').then(r => r.json()),
  ttl: 15_000,
})

await query.revalidate({
  key: 'api:user:1',
  fetcher: () => fetch('/api/user/1').then(r => r.json()),
})
```

### 5. 插件钩子链路

`CachePlugin` 已在 `CacheManager` 中完整生效：

- `init`
- `beforeSet / afterSet`
- `beforeGet / afterGet`
- `beforeDelete / afterDelete`
- `beforeClear / afterClear`
- `destroy`

钩子异常会隔离，不会中断主流程。

### 6. Engine 插件

```ts
import { createCacheEnginePlugin, cacheStateKeys } from '@ldesign/cache-core'

const plugin = createCacheEnginePlugin({
  maxSize: 300,
  defaultTTL: 15000,
  enablePersistence: true,
})

await engine.use(plugin)

const manager = engine.state.get(cacheStateKeys.MANAGER)
const api = engine.api.get('cache')
```

Engine 插件提供：

- 稳定键：`cacheStateKeys`、`cacheEventKeys`
- API 注册：`engine.api.register('cache')`
- 访问器：`getInstance()`、`getContext()`

## 迁移说明（重构前 -> 重构后）

### `CacheOptions`

- 删除了未落地实现的字段（如压缩/加密/自定义序列化等管理器层配置）。
- 保留并聚焦已实现能力：策略、容量、TTL、持久化、插件、统计与回调。

### `set`

- 旧：`set(key, value, ttl?)`
- 新：`set(key, value, ttlOrOptions?)`

```ts
cache.set('k', 'v', 5000)
cache.set('k', 'v', {
  ttl: 5000,
  tags: ['a'],
  namespace: 'ns',
  priority: 10,
})
```

### 新增失效 API

- `invalidateByTag`
- `invalidateByNamespace`
- `invalidateWhere`

### 查询增强统一到 core

- 使用 `cache.query.fetch/prefetch/revalidate`
- Vue 层只做响应式封装

## License

MIT
