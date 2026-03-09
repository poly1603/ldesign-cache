# @ldesign/cache-vue

`@ldesign/cache-vue` 是 `@ldesign/cache-core` 的 Vue 适配层，负责：

- 原生 Vue 插件接入（`createCachePlugin`）
- Engine 模式接入（`createCacheEnginePlugin`）
- 响应式 composables（`useCache`、`useCacheQuery`、`useSWR`）
- 指令/组件/装饰器适配

## 安装

```bash
pnpm add @ldesign/cache-vue
```

## 双插件体系

## 1) 原生 Vue 插件

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { createCachePlugin } from '@ldesign/cache-vue'

const app = createApp(App)

app.use(createCachePlugin({
  strategy: 'lru',
  maxSize: 200,
  defaultTTL: 15000,
  enablePersistence: true,
  storageType: 'localStorage',
  storagePrefix: 'cache-demo:',
}))

app.mount('#app')
```

## 2) Engine 适配插件

```ts
import { createVueEngine } from '@ldesign/engine-vue3'
import { createCacheEnginePlugin } from '@ldesign/cache-vue'

const cachePlugin = createCacheEnginePlugin({
  maxSize: 200,
  defaultTTL: 15000,
  vue: {
    globalPropertyName: '$cache',
    registerDirective: true,
    registerComponents: true,
  },
})

const engine = createVueEngine({
  app: { rootComponent: App },
  plugins: [cachePlugin as any],
})

engine.mount('#app')
```

该插件同时覆盖：

- `app` 已可用时的立即安装
- `app:created` 事件后的延迟安装

## Composables

## useCache

`useCache` 优先使用注入实例（插件提供），未注入时才本地创建。

```ts
import { useCache } from '@ldesign/cache-vue'

const { cache, set, get, stats, invalidateByTag } = useCache({
  reactiveStats: true,
})

set('user:1', { id: 1 }, {
  tags: ['user'],
  namespace: '用户模块',
  ttl: 5000,
})

const data = get('user:1')
invalidateByTag('user')
```

## useCacheQuery

基于 core 查询模块的响应式封装。

```ts
const { data, loading, isFromCache, execute, refetch } = useCacheQuery({
  key: 'api:list',
  queryFn: () => fetch('/api/list').then(r => r.json()),
  dedupe: true,
  swr: true,
  staleTime: 2000,
  ttl: 10000,
})
```

## useSWR

```ts
const { data, isValidating, revalidate, mutate } = useSWR({
  key: 'api:user:1',
  fetcher: () => fetch('/api/user/1').then(r => r.json()),
  staleTime: 1000,
  ttl: 10000,
})
```

## 指令/组件/装饰器

### `v-cache`

```vue
<p v-cache="{ key: 'home:title', fetcher: loadTitle, ttl: 5000 }">加载中</p>
```

### `CacheProvider`

```vue
<CacheProvider :options="{ namespace: '局部命名空间' }" v-slot="{ cache }">
  <button @click="cache.set('x', 1)">写入</button>
</CacheProvider>
```

### `@Cacheable`

```ts
@Cacheable({ cache, ttl: 10000, namespace: '服务层', tags: ['api'] })
async getUser(id: string) {
  return request(`/api/user/${id}`)
}
```

## 迁移说明（重构前 -> 重构后）

### 插件结构

- 旧：单一 `plugin.ts`
- 新：
  - `plugins/plugin.ts`（原生 Vue）
  - `plugins/engine-plugin.ts`（Engine 适配）
  - `plugins/index.ts`（聚合导出）

### 注入键

- 旧：多处重复定义
- 新：`CACHE_INJECTION_KEY` 单一来源（`src/constants.ts`）

### useCache 行为

- 旧：默认本地创建，容易与插件实例割裂
- 新：优先注入实例，未注入才创建本地实例

### useCacheQuery/useSWR

- 旧：各自重复实现查询逻辑
- 新：统一走 core 查询模块，Vue 仅做响应式包装

## License

MIT
