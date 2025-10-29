# @ldesign/cache-vue

> LDesign Cache 的 Vue 3 集成包 - 响应式缓存管理

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-vue.svg)](https://www.npmjs.com/package/@ldesign/cache-vue)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ldesign/cache-vue)](https://bundlephobia.com/package/@ldesign/cache-vue)
[![license](https://img.shields.io/npm/l/@ldesign/cache-vue.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **Composition API** - 完整的 Vue 3 Composition API 支持
- 🔄 **响应式** - 自动追踪缓存变化并更新 UI
- 📦 **Provider 模式** - 全局缓存实例注入
- ⚡ **自动刷新** - 支持轮询和条件刷新
- 🎨 **TypeScript** - 完整的类型定义

## 安装

```bash
# npm
npm install @ldesign/cache-vue @ldesign/cache-core

# yarn
yarn add @ldesign/cache-vue @ldesign/cache-core

# pnpm
pnpm add @ldesign/cache-vue @ldesign/cache-core
```

## 快速开始

### 基础使用

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

interface User {
  name: string
  age: number
}

const { data, loading, error, refresh, update } = useCache<User>('user', {
  fetcher: async () => {
    const res = await fetch('/api/user')
    return res.json()
  },
  ttl: 60 * 1000, // 1分钟
})
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else-if="data">
      <p>姓名: {{ data.name }}</p>
      <p>年龄: {{ data.age }}</p>
      <button @click="refresh">刷新</button>
    </div>
  </div>
</template>
```

### 使用 Provider

```vue
<!-- App.vue -->
<script setup lang="ts">
import { CacheProvider } from '@ldesign/cache-vue'
import { createCache } from '@ldesign/cache-core'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 60 * 1000,
})
</script>

<template>
  <CacheProvider :cache="cache">
    <YourApp />
  </CacheProvider>
</template>
```

```vue
<!-- Component.vue -->
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

// 自动使用 Provider 提供的缓存实例
const { data } = useCache('key')
</script>
```

### 手动操作

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { data, update, remove } = useCache<string>('message')

async function saveMessage() {
  await update('Hello World', { ttl: 5000 })
}

async function deleteMessage() {
  await remove()
}
</script>

<template>
  <div>
    <input v-model="data" />
    <button @click="saveMessage">保存</button>
    <button @click="deleteMessage">删除</button>
  </div>
</template>
```

### 自动刷新

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

// 每 5 秒自动刷新一次
const { data } = useCache('realtime-data', {
  fetcher: () => fetch('/api/data').then(r => r.json()),
  refreshInterval: 5000,
})
</script>
```

### 缓存统计

```vue
<script setup lang="ts">
import { useCacheStats } from '@ldesign/cache-vue'

const { stats, refresh } = useCacheStats()
</script>

<template>
  <div>
    <p>总键数: {{ stats?.totalKeys }}</p>
    <p>命中率: {{ (stats?.hitRate * 100).toFixed(2) }}%</p>
    <button @click="refresh">刷新统计</button>
  </div>
</template>
```

## API

### useCache(key, options?)

返回响应式的缓存操作对象。

**参数：**
- `key: string` - 缓存键名
- `options?: UseCacheOptions` - 配置选项
  - `immediate?: boolean` - 是否立即加载（默认 `true`）
  - `fetcher?: () => Promise<T> | T` - 数据获取函数
  - `refreshInterval?: number` - 自动刷新间隔（毫秒）
  - `ttl?: number` - 过期时间
  - `engine?: string` - 存储引擎

**返回：**
- `data: Ref<T | null>` - 缓存数据
- `loading: Ref<boolean>` - 加载状态
- `error: Ref<Error | null>` - 错误信息
- `exists: Ref<boolean>` - 是否存在
- `refresh: () => Promise<void>` - 刷新数据
- `update: (value, options?) => Promise<void>` - 更新数据
- `remove: () => Promise<void>` - 删除数据

### useCacheStats()

获取缓存统计信息。

### CacheProvider

提供全局缓存实例的组件。

**Props：**
- `cache?: CacheManager` - 缓存管理器实例
- `options?: CacheOptions` - 缓存配置选项

## 许可证

MIT License © LDesign Team


