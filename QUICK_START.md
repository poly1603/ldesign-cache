# 🚀 Cache 包快速开始指南

## 📦 安装依赖

```bash
# 进入 cache 目录
cd packages/cache

# 安装所有子包依赖
pnpm install -r
```

## 🏗️ 构建所有子包

```bash
# 方式 1：构建所有 cache 子包
pnpm -r --filter "@ldesign/cache-*" build

# 方式 2：逐个构建
cd packages/core && pnpm build
cd ../vue && pnpm build
cd ../react && pnpm build
cd ../solid && pnpm build
cd ../svelte && pnpm build
cd ../angular && pnpm build
cd ../lit && pnpm build
cd ../devtools && pnpm build
```

## 🎯 运行演示

### Vue 演示

```bash
cd examples/demo-vue
pnpm install
pnpm dev
```

访问：http://localhost:3100

### React 演示

```bash
cd examples/demo-react
pnpm install
pnpm dev
```

访问：http://localhost:3101

## 📖 使用示例

### 1. 核心包（纯 JS/TS）

```bash
pnpm add @ldesign/cache-core
```

```typescript
import { createCache } from '@ldesign/cache-core'

const cache = createCache()
await cache.set('key', 'value')
const value = await cache.get('key')
```

### 2. Vue 3 项目

```bash
pnpm add @ldesign/cache-vue @ldesign/cache-core
```

```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { data, loading } = useCache('user', {
  fetcher: () => fetch('/api/user').then(r => r.json()),
})
</script>

<template>
  <div>{{ loading ? 'Loading...' : data }}</div>
</template>
```

### 3. React 项目

```bash
pnpm add @ldesign/cache-react @ldesign/cache-core
```

```tsx
import { useCache } from '@ldesign/cache-react'

function App() {
  const { data, loading } = useCache('user', {
    fetcher: () => fetch('/api/user').then(r => r.json()),
  })
  
  return <div>{loading ? 'Loading...' : data?.name}</div>
}
```

### 4. Solid 项目

```bash
pnpm add @ldesign/cache-solid @ldesign/cache-core
```

```tsx
import { createCache } from '@ldesign/cache-solid'

function App() {
  const { data, loading } = createCache('user', {
    fetcher: () => fetch('/api/user').then(r => r.json()),
  })
  
  return <div>{loading() ? 'Loading...' : data()?.name}</div>
}
```

### 5. Svelte 项目

```bash
pnpm add @ldesign/cache-svelte @ldesign/cache-core
```

```svelte
<script>
  import { cacheStore } from '@ldesign/cache-svelte'
  
  const user = cacheStore('user', {
    fetcher: () => fetch('/api/user').then(r => r.json()),
  })
</script>

{#if $user.loading}
  Loading...
{:else}
  {$user.data?.name}
{/if}
```

### 6. Angular 项目

```bash
pnpm add @ldesign/cache-angular @ldesign/cache-core
```

```typescript
import { Component } from '@angular/core'
import { CacheService } from '@ldesign/cache-angular'

@Component({...})
export class AppComponent {
  user: any
  
  constructor(private cache: CacheService) {
    this.cache.remember('user', () =>
      fetch('/api/user').then(r => r.json())
    ).subscribe(data => this.user = data)
  }
}
```

## 🔧 开发模式

```bash
# 监听模式（自动重新构建）
cd packages/core
pnpm dev
```

## 📝 检查类型

```bash
cd packages/core
pnpm type-check
```

## 🧪 测试（待实现）

```bash
# 运行测试
pnpm test

# 运行测试并生成覆盖率
pnpm test:coverage
```

## 📚 更多文档

- [架构文档](./ARCHITECTURE.md)
- [完整实现报告](./IMPLEMENTATION_COMPLETE.md)
- [框架支持文档](./FULL_FRAMEWORK_SUPPORT.md)
- [子包总览](./packages/README.md)

## ⚠️ 常见问题

### 构建失败

```bash
# 清理并重新安装
pnpm clean-build
pnpm install -r
pnpm -r build
```

### 类型错误

确保所有依赖都已安装：

```bash
pnpm install -r
```

### 演示无法运行

```bash
cd examples/demo-vue
rm -rf node_modules
pnpm install
pnpm dev
```

## 🎯 下一步

1. ✅ 安装依赖
2. ✅ 构建所有子包
3. ✅ 运行演示示例
4. ✅ 根据需要选择框架集成
5. 📝 编写测试
6. 📖 完善文档

---

**开始使用吧！** 🚀

