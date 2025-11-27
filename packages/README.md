# @ldesign/cache 子包架构

> 企业级缓存管理系统，提供多种缓存策略和框架集成

## 📦 子包列表

### 核心包

#### [@ldesign/cache-core](./core)
核心缓存管理功能，提供多种缓存策略和完整的缓存管理能力。

**功能特性：**
- ✅ 4 种缓存策略（LRU、LFU、FIFO、TTL）
- ✅ O(1) 时间复杂度的核心操作
- ✅ 完整的统计功能（命中率、淘汰次数等）
- ✅ 事件系统（监听缓存操作）
- ✅ 批量操作（批量读写）
- ✅ 持久化支持（localStorage/sessionStorage）
- ✅ 自动清理过期项
- ✅ 完整的 TypeScript 类型定义

**安装：**
```bash
pnpm add @ldesign/cache-core
```

**基础使用：**
```typescript
import { CacheManager, CacheStrategy } from '@ldesign/cache-core'

const cache = new CacheManager({
  strategy: CacheStrategy.LRU,
  maxSize: 100,
  defaultTTL: 5000,
  enableStats: true
})

cache.set('key', 'value')
const value = cache.get('key')

// 获取统计信息
const stats = cache.getStats()
console.log('命中率:', stats.hitRate)
```

---

### 框架集成包

#### [@ldesign/cache-vue](./vue)
Vue 3 集成，提供响应式缓存管理和 Composition API。

**功能特性：**
- ✅ `useCache` Composable - 响应式缓存操作
- ✅ Vue 插件支持 - 全局注册和依赖注入
- ✅ 响应式统计信息 - 实时更新的缓存状态
- ✅ 自动生命周期管理 - 组件卸载时自动清理
- ✅ 完整 TypeScript 支持
- ✅ 支持所有核心缓存策略

**安装：**
```bash
pnpm add @ldesign/cache-vue
```

**使用 Composable：**
```vue
<script setup lang="ts">
import { useCache } from '@ldesign/cache-vue'

const { get, set, size, stats } = useCache<User>({
  strategy: 'lru',
  maxSize: 100,
  defaultTTL: 5000,
  enableStats: true
})

// 设置缓存
set('user:1', { id: 1, name: 'John' })

// 获取缓存
const user = get('user:1')
</script>

<template>
  <div>
    <p>缓存大小: {{ size }}</p>
    <p>命中率: {{ (stats.hitRate * 100).toFixed(2) }}%</p>
  </div>
</template>
```

**使用插件：**
```typescript
// main.ts
import { createApp } from 'vue'
import { CachePlugin } from '@ldesign/cache-vue'

const app = createApp(App)

app.use(CachePlugin, {
  strategy: 'lru',
  maxSize: 100,
  enableStats: true
})
```

---

#### [@ldesign/cache-react](./react)
React 集成，提供 Hooks 和 Context Provider。

**功能特性：**
- ✅ React Hooks
- ✅ Context Provider
- ✅ 自动状态管理
- ✅ 依赖追踪和刷新
- ✅ TypeScript 支持

**安装：**
```bash
pnpm add @ldesign/cache-react @ldesign/cache-core
```

**使用：**
```tsx
import { useCache } from '@ldesign/cache-react'

function Component() {
  const { data, loading, refresh } = useCache('user', {
    fetcher: async () => {
      const res = await fetch('/api/user')
      return res.json()
    },
  })

  return <div>{loading ? 'Loading...' : data?.name}</div>
}
```

---

#### [@ldesign/cache-lit](./lit)
Lit 集成，提供指令和混入。

**功能特性：**
- ✅ Lit 指令
- ✅ Mixin 支持
- ✅ 声明式缓存管理
- ✅ Web Components 友好

**安装：**
```bash
pnpm add @ldesign/cache-lit @ldesign/cache-core
```

**使用：**
```typescript
import { LitElement, html } from 'lit'
import { CacheMixin } from '@ldesign/cache-lit'

class MyElement extends CacheMixin(LitElement) {
  render() {
    return html`<div>Cached Component</div>`
  }
}
```

---

### 工具包

#### [@ldesign/cache-devtools](./devtools)
开发者工具，提供性能分析和调试功能。

**功能特性：**
- ✅ 缓存检查器
- ✅ 性能分析器
- ✅ 实时监控
- ✅ 优化建议

**安装：**
```bash
pnpm add @ldesign/cache-devtools
```

---

## 🎯 选择合适的子包

### 基础使用（浏览器环境）
```bash
pnpm add @ldesign/cache-core
```

### Vue 3 项目
```bash
pnpm add @ldesign/cache-vue @ldesign/cache-core
```

### React 项目
```bash
pnpm add @ldesign/cache-react @ldesign/cache-core
```

### Lit / Web Components 项目
```bash
pnpm add @ldesign/cache-lit @ldesign/cache-core
```

### 开发调试
```bash
pnpm add @ldesign/cache-devtools
```

---

## 🚀 演示示例

所有子包都提供了基于 `@ldesign/launcher` 的演示示例：

### Vue 演示
```bash
cd examples/demo-vue
pnpm dev  # http://localhost:3100
```

### React 演示
```bash
cd examples/demo-react
pnpm dev  # http://localhost:3101
```

---

## 🏗️ 构建子包

所有子包都使用 `@ldesign/builder` 进行打包，生成 UMD、ESM 和 CJS 格式：

```bash
# 进入子包目录
cd packages/core

# 开发模式（watch）
pnpm dev

# 构建
pnpm build

# 清理并构建
pnpm build:clean
```

### 输出目录结构
```
packages/core/
├── dist/           # UMD 格式 + 类型定义
│   ├── cache-core.umd.js
│   └── index.d.ts
├── es/             # ESM 格式
│   └── index.js
└── lib/            # CJS 格式
    └── index.js
```

---

## 📚 文档

- [Core 文档](./core/README.md)
- [Vue 文档](./vue/README.md)
- [React 文档](./react/README.md)
- [Lit 文档](./lit/README.md)
- [Devtools 文档](./devtools/README.md)

---

## 🔧 技术栈

- **TypeScript 5.7+** - 类型安全
- **@ldesign/builder** - 统一构建工具
- **@ldesign/launcher** - 开发服务器
- **Rollup** - 打包引擎
- **Vite** - 开发环境

---

## 📝 开发指南

### 添加新子包

1. 创建子包目录：
```bash
mkdir packages/your-package
```

2. 创建必要文件：
- `package.json` - 包配置
- `builder.config.ts` - 构建配置
- `tsconfig.json` - TypeScript 配置
- `src/index.ts` - 入口文件
- `README.md` - 文档

3. 配置构建：
```typescript
// builder.config.ts
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
    name: 'YourPackage',
  },
  dts: { enabled: true },
})
```

4. 创建演示示例：
```bash
mkdir -p examples/demo-your-package
# 配置 @ldesign/launcher
```

### 发布流程

```bash
# 1. 构建所有子包
pnpm build

# 2. 版本管理
pnpm changeset

# 3. 发布
pnpm publish -r
```

---

## 🤝 贡献

欢迎贡献代码！请遵循以下规范：

1. 所有子包必须使用 `@ldesign/builder` 打包
2. 必须提供完整的 TypeScript 类型定义
3. 必须创建演示示例（基于 `@ldesign/launcher`）
4. 必须编写 README 文档
5. 必须通过 ESLint 和 TypeScript 检查

---

## 📄 许可证

MIT License © LDesign Team


