# @ldesign/cache-vue

企业级缓存管理库 - Vue 3 适配器

## 特性

- 🎯 **响应式** - 完全响应式的缓存操作
- 🔌 **插件支持** - 提供 Vue 插件，全局注册
- 🪝 **Composable** - 提供 `useCache` composable
- 🔄 **自动清理** - 组件卸载时自动清理
- 📊 **响应式统计** - 实时更新的缓存统计信息
- 💉 **依赖注入** - 支持 Vue 的 provide/inject

## 安装

```bash
pnpm add @ldesign/cache-vue
```

## 快速开始

### 使用 Composable

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { get, set, size, stats, keys } = useCache<User>({
  strategy: 'lru',
  maxSize: 100,
  defaultTTL: 5000,
  enableStats: true
})

// 设置缓存
set('user:1', { id: 1, name: 'John' })

// 获取缓存
const user = get('user:1')

// 响应式统计
console.log('缓存大小:', size.value)
console.log('命中率:', stats.value.hitRate)
console.log('所有键:', keys.value)
</script>

<template>
  <div>
    <p>缓存大小: {{ size }}</p>
    <p>命中率: {{ (stats.hitRate * 100).toFixed(2) }}%</p>
    <p>总请求: {{ stats.totalRequests }}</p>
    <p>命中: {{ stats.hits }}</p>
    <p>未命中: {{ stats.misses }}</p>
  </div>
</template>
```

### 使用插件

```typescript
// main.ts
import { createApp } from 'vue'
import { CachePlugin } from '@ldesign/cache-vue'
import App from './App.vue'

const app = createApp(App)

app.use(CachePlugin, {
  strategy: 'lru',
  maxSize: 100,
  defaultTTL: 5000,
  enableStats: true,
  globalPropertyName: '$cache' // 全局属性名
})

app.mount('#app')
```

#### Composition API 中使用

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { CACHE_INJECTION_KEY } from '@ldesign/cache-vue'

const cache = inject(CACHE_INJECTION_KEY)

// 使用缓存
cache?.set('key', 'value')
const value = cache?.get('key')
</script>
```

#### Options API 中使用

```vue
<script>
export default {
  mounted() {
    // 使用全局属性
    this.$cache.set('key', 'value')
    const value = this.$cache.get('key')
    
    // 获取统计
    const stats = this.$cache.getStats()
    console.log('命中率:', stats.hitRate)
  }
}
</script>
```

## 高级用法

### 事件监听

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { on, off } = useCache()

// 监听缓存命中
on('hit', (event) => {
  console.log('缓存命中:', event.key)
})

// 监听缓存淘汰
on('evict', (event) => {
  console.log('缓存淘汰:', event.key, event.value)
})
</script>
```

### 批量操作

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { mset, mget, mdel } = useCache<User>()

// 批量设置
mset([
  ['user:1', { id: 1, name: 'John' }],
  ['user:2', { id: 2, name: 'Jane' }],
  ['user:3', { id: 3, name: 'Bob' }]
], 5000)

// 批量获取
const users = mget(['user:1', 'user:2', 'user:3'])

// 批量删除
mdel(['user:1', 'user:2'])
</script>
```

### 持久化

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { set, get } = useCache({
  strategy: 'lru',
  maxSize: 100,
  enablePersistence: true,
  storageType: 'localStorage',
  storagePrefix: 'my-app:'
})

// 缓存会自动保存到 localStorage
set('user:1', { id: 1, name: 'John' })

// 刷新页面后，缓存会自动恢复
</script>
```

## API 文档

### useCache

```typescript
function useCache<T = any>(options?: UseCacheOptions): UseCacheReturn<T>
```

#### 选项

- `strategy` - 缓存策略 ('lru' | 'lfu' | 'fifo' | 'ttl')
- `maxSize` - 最大缓存容量
- `defaultTTL` - 默认过期时间（毫秒）
- `enableStats` - 是否启用统计
- `enablePersistence` - 是否启用持久化
- `storageType` - 存储类型 ('localStorage' | 'sessionStorage')
- `autoCleanup` - 是否自动清理（组件卸载时）
- `reactiveStats` - 是否启用响应式统计

#### 返回值

- `cache` - 缓存管理器实例
- `get` - 获取缓存项
- `set` - 设置缓存项
- `delete` - 删除缓存项
- `has` - 检查缓存项是否存在
- `clear` - 清空所有缓存
- `size` - 缓存大小（响应式）
- `keys` - 所有键（响应式）
- `stats` - 统计信息（响应式）
- `mget` - 批量获取
- `mset` - 批量设置
- `mdel` - 批量删除
- `cleanup` - 清理过期项
- `on` - 监听事件
- `off` - 移除事件监听

## License

MIT

