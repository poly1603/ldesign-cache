# @ldesign/cache-react

> LDesign Cache 的 React 集成包 - 提供 Hooks 和 Context

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-react.svg)](https://www.npmjs.com/package/@ldesign/cache-react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ldesign/cache-react)](https://bundlephobia.com/package/@ldesign/cache-react)
[![license](https://img.shields.io/npm/l/@ldesign/cache-react.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **React Hooks** - 完整的 React Hooks 支持
- 🔄 **自动更新** - 缓存变化自动触发组件重新渲染
- 📦 **Context Provider** - 全局缓存实例管理
- ⚡ **自动刷新** - 支持轮询和依赖刷新
- 🎨 **TypeScript** - 完整的类型定义

## 安装

```bash
# npm
npm install @ldesign/cache-react @ldesign/cache-core

# yarn
yarn add @ldesign/cache-react @ldesign/cache-core

# pnpm
pnpm add @ldesign/cache-react @ldesign/cache-core
```

## 快速开始

### 基础使用

```tsx
import { useCache } from '@ldesign/cache-react'

interface User {
  name: string
  age: number
}

function UserProfile() {
  const { data, loading, error, refresh } = useCache<User>('user', {
    fetcher: async () => {
      const res = await fetch('/api/user')
      return res.json()
    },
    ttl: 60 * 1000, // 1分钟
  })

  if (loading) return <div>加载中...</div>
  if (error) return <div>错误: {error.message}</div>
  if (!data) return null

  return (
    <div>
      <p>姓名: {data.name}</p>
      <p>年龄: {data.age}</p>
      <button onClick={refresh}>刷新</button>
    </div>
  )
}
```

### 使用 Provider

```tsx
// App.tsx
import { CacheProvider } from '@ldesign/cache-react'
import { createCache } from '@ldesign/cache-core'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 60 * 1000,
})

export default function App() {
  return (
    <CacheProvider cache={cache}>
      <YourApp />
    </CacheProvider>
  )
}
```

```tsx
// Component.tsx
import { useCache } from '@ldesign/cache-react'

function Component() {
  // 自动使用 Provider 提供的缓存实例
  const { data } = useCache('key')
  return <div>{data}</div>
}
```

### 手动操作

```tsx
import { useCache } from '@ldesign/cache-react'

function MessageEditor() {
  const { data, update, remove } = useCache<string>('message')

  const handleSave = async () => {
    await update('Hello World', { ttl: 5000 })
  }

  const handleDelete = async () => {
    await remove()
  }

  return (
    <div>
      <input value={data || ''} readOnly />
      <button onClick={handleSave}>保存</button>
      <button onClick={handleDelete}>删除</button>
    </div>
  )
}
```

### 自动刷新

```tsx
import { useCache } from '@ldesign/cache-react'

function RealtimeData() {
  // 每 5 秒自动刷新一次
  const { data } = useCache('realtime-data', {
    fetcher: () => fetch('/api/data').then(r => r.json()),
    refreshInterval: 5000,
  })

  return <div>{JSON.stringify(data)}</div>
}
```

### 依赖刷新

```tsx
import { useState } from 'react'
import { useCache } from '@ldesign/cache-react'

function UserPosts() {
  const [userId, setUserId] = useState('123')

  // userId 变化时自动刷新
  const { data } = useCache(`user-${userId}-posts`, {
    fetcher: () => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
    deps: [userId],
  })

  return (
    <div>
      <select value={userId} onChange={e => setUserId(e.target.value)}>
        <option value="123">用户 123</option>
        <option value="456">用户 456</option>
      </select>
      <div>{JSON.stringify(data)}</div>
    </div>
  )
}
```

### 缓存统计

```tsx
import { useCacheStats } from '@ldesign/cache-react'

function CacheStats() {
  const { stats, loading, refresh } = useCacheStats()

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <p>总键数: {stats?.totalKeys}</p>
      <p>命中率: {((stats?.hitRate || 0) * 100).toFixed(2)}%</p>
      <button onClick={refresh}>刷新统计</button>
    </div>
  )
}
```

## API

### useCache(key, options?)

React Hook，用于管理缓存数据。

**参数：**
- `key: string` - 缓存键名
- `options?: UseCacheOptions` - 配置选项
  - `immediate?: boolean` - 是否立即加载（默认 `true`）
  - `fetcher?: () => Promise<T> | T` - 数据获取函数
  - `refreshInterval?: number` - 自动刷新间隔（毫秒）
  - `deps?: any[]` - 依赖项数组
  - `ttl?: number` - 过期时间
  - `engine?: string` - 存储引擎

**返回：**
- `data: T | null` - 缓存数据
- `loading: boolean` - 加载状态
- `error: Error | null` - 错误信息
- `exists: boolean` - 是否存在
- `refresh: () => Promise<void>` - 刷新数据
- `update: (value, options?) => Promise<void>` - 更新数据
- `remove: () => Promise<void>` - 删除数据

### useCacheStats()

获取缓存统计信息的 Hook。

### CacheProvider

提供全局缓存实例的 Context Provider。

**Props：**
- `children: ReactNode` - 子组件
- `cache?: CacheManager` - 缓存管理器实例
- `options?: CacheOptions` - 缓存配置选项

### useCacheContext()

获取 Context 中的缓存实例。

## 许可证

MIT License © LDesign Team


