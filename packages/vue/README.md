# @ldesign/cache-vue

> @ldesign/cache-core 的 Vue 3 适配层 - 响应式缓存管理

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-vue.svg)](https://www.npmjs.com/package/@ldesign/cache-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ldesign/cache-vue)](https://bundlephobia.com/package/@ldesign/cache-vue)
[![license](https://img.shields.io/npm/l/@ldesign/cache-vue.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## ✨ 特性

- 🎯 **Composition API** - 完整的 Vue 3 Composition API 支持
- 🔄 **响应式缓存** - 自动追踪缓存变化并更新 UI
- 📦 **Vue Plugin** - 支持 `app.use()` 全局安装
- 🔌 **Engine Plugin** - 支持 LDesign Engine 集成
- ⚡ **自动刷新** - 支持轮询和条件刷新
- 🎨 **TypeScript** - 完整的类型定义和智能提示

## 📦 安装

```bash
# pnpm (推荐)
pnpm add @ldesign/cache-vue @ldesign/cache-core

# npm
npm install @ldesign/cache-vue @ldesign/cache-core

# yarn
yarn add @ldesign/cache-vue @ldesign/cache-core
```

## 🚀 快速开始

### 方式一：Vue Plugin

```typescript
import { cachePlugin } from '@ldesign/cache-vue'
// main.ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.use(cachePlugin, {
  defaultTTL: 5 * 60 * 1000, // 5分钟
  engines: {
    memory: {
      maxItems: 5000,
      evictionStrategy: 'LRU'
    }
  }
})

app.mount('#app')
```

### 方式二：Engine Plugin

```typescript
// plugins/index.ts
import { createCacheEnginePlugin } from '@ldesign/cache-vue/plugins'

export const plugins = [
  createCacheEnginePlugin({
    defaultTTL: 5 * 60 * 1000,
    engines: {
      memory: {
        maxItems: 5000,
        evictionStrategy: 'LRU'
      }
    },
    debug: true
  })
]
```

## 📖 Composables

### useCache

基础缓存操作组合式函数：

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { set, get, remove, clear, has, keys, getStats, useReactiveCache } = useCache()

// 基础操作
await set('user:1', { name: '张三', age: 25 })
const user = await get<{ name: string, age: number }>('user:1')
await remove('user:1')

// 响应式缓存
const userCache = useReactiveCache<{ name: string }>('user:1')
// 响应式访问: userCache.value.value
await userCache.set({ name: '李四' })
await userCache.refresh()
</script>
```

### useCacheValue

简单值缓存：

```vue
<script setup lang="ts">
import { useCacheValue } from '@ldesign/cache-vue'

const { value, set, refresh, remove, loading, error } = useCacheValue<string>('message', '默认值', {
  ttl: 60000
})
</script>

<template>
  <div>
    <p>值: {{ value }}</p>
    <button @click="set('新消息')">
      更新
    </button>
    <button @click="refresh">
      刷新
    </button>
  </div>
</template>
```

### useCacheSync

双向绑定缓存（支持 v-model）：

```vue
<script setup lang="ts">
import { useCacheSync } from '@ldesign/cache-vue'

const { value, loading, error } = useCacheSync<string>('input-value', '', {
  ttl: 60000,
  debounce: 300 // 防抖延迟
})
</script>

<template>
  <input v-model="value" placeholder="输入会自动保存到缓存">
</template>
```

### useCacheStats

缓存统计信息：

```vue
<script setup lang="ts">
import { useCacheStats } from '@ldesign/cache-vue'

const { stats, hitRatePercent, totalRequests, refresh } = useCacheStats({
  autoRefresh: true,
  refreshInterval: 5000
})
</script>

<template>
  <div>
    <p>总键数: {{ stats?.totalKeys }}</p>
    <p>命中率: {{ hitRatePercent }}</p>
    <p>总请求: {{ totalRequests }}</p>
    <button @click="refresh">
      刷新
    </button>
  </div>
</template>
```

## 📖 API 文档

### useCache 返回值

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `set` | `(key, value, options?) => Promise<void>` | 设置缓存 |
| `get` | `<T>(key) => Promise<T \| null>` | 获取缓存 |
| `remove` | `(key) => Promise<void>` | 删除缓存 |
| `clear` | `(engine?) => Promise<void>` | 清空缓存 |
| `has` | `(key) => Promise<boolean>` | 检查是否存在 |
| `keys` | `(engine?) => Promise<string[]>` | 获取所有键 |
| `getStats` | `() => Promise<CacheStats>` | 获取统计信息 |
| `stats` | `ComputedRef<CacheStats \| null>` | 响应式统计 |
| `loading` | `ComputedRef<boolean>` | 加载状态 |
| `error` | `ComputedRef<Error \| null>` | 错误信息 |
| `useReactiveCache` | `<T>(key, defaultValue?) => ReactiveCache<T>` | 创建响应式缓存 |
| `manager` | `CacheManager` | 缓存管理器实例 |

### ReactiveCache 返回值

| 属性/方法 | 类型 | 描述 |
|-----------|------|------|
| `value` | `ComputedRef<T \| null>` | 缓存值 |
| `loading` | `ComputedRef<boolean>` | 加载状态 |
| `error` | `ComputedRef<Error \| null>` | 错误信息 |
| `exists` | `ComputedRef<boolean>` | 是否存在 |
| `set` | `(value, options?) => Promise<void>` | 设置值 |
| `refresh` | `() => Promise<void>` | 刷新值 |
| `remove` | `() => Promise<void>` | 删除值 |

## 🔧 TypeScript 支持

完整的类型定义，支持智能提示：

```typescript
import type {
  CachePluginOptions,
  ReactiveCache,
  UseCacheReturn,
  UseCacheStatsReturn
} from '@ldesign/cache-vue'
```

全局属性类型声明（使用 Vue Plugin 后）：

```typescript
// 在组件中可以使用 this.$cache
this.$cache.set('key', 'value')
```

## 📄 许可证

MIT License © LDesign Team
