# 🚀 @ldesign/cache - 多框架缓存管理系统

> 功能强大、支持多框架的浏览器缓存管理库

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-38%2F38%20passing-success.svg)](./TEST_REPORT.md)

---

## ✨ 特性

- 🎯 **8 个框架支持** - Vue、React、Solid、Svelte、Angular、Lit 等
- 📦 **多存储引擎** - Memory、LocalStorage、SessionStorage、IndexedDB、Cookie、OPFS
- 🔒 **安全加固** - AES 加密、键名混淆
- ⚡ **高性能** - 智能策略、性能监控
- 🔄 **跨标签页同步** - 多标签页数据同步
- 🌐 **跨设备同步** - WebSocket/轮询/SSE 支持
- 🎨 **TypeScript** - 完整的类型定义
- ✅ **测试完整** - 38 个测试全部通过

---

## 📦 子包列表

### 核心包

#### [@ldesign/cache-core](./packages/core) - 核心功能

框架无关的缓存管理核心。

```bash
pnpm add @ldesign/cache-core
```

```typescript
import { createCache } from '@ldesign/cache-core'

const cache = createCache()
await cache.set('key', 'value')
```

**测试状态：** ✅ 38/38 通过

---

### 框架适配器

#### [@ldesign/cache-vue](./packages/vue) - Vue 3

```bash
pnpm add @ldesign/cache-vue @ldesign/cache-core
```

```vue
<script setup>
import { useCache } from '@ldesign/cache-vue'
const { data, loading } = useCache('user', { fetcher })
</script>
```

#### [@ldesign/cache-react](./packages/react) - React

```bash
pnpm add @ldesign/cache-react @ldesign/cache-core
```

```tsx
import { useCache } from '@ldesign/cache-react'
const { data, loading } = useCache('user', { fetcher })
```

#### [@ldesign/cache-solid](./packages/solid) - Solid.js ⭐

```bash
pnpm add @ldesign/cache-solid @ldesign/cache-core
```

```tsx
import { createCache } from '@ldesign/cache-solid'
const { data, loading } = createCache('user', { fetcher })
```

#### [@ldesign/cache-svelte](./packages/svelte) - Svelte ⭐

```bash
pnpm add @ldesign/cache-svelte @ldesign/cache-core
```

```svelte
<script>
  import { cacheStore } from '@ldesign/cache-svelte'
  const user = cacheStore('user', { fetcher })
</script>
```

#### [@ldesign/cache-angular](./packages/angular) - Angular ⭐

```bash
pnpm add @ldesign/cache-angular @ldesign/cache-core
```

```typescript
import { CacheService } from '@ldesign/cache-angular'

constructor(private cache: CacheService) {}
```

#### [@ldesign/cache-lit](./packages/lit) - Lit

```bash
pnpm add @ldesign/cache-lit @ldesign/cache-core
```

```typescript
import { CacheMixin } from '@ldesign/cache-lit'
class MyElement extends CacheMixin(LitElement) {}
```

---

### 工具包

#### [@ldesign/cache-devtools](./packages/devtools) - 开发工具

```bash
pnpm add @ldesign/cache-devtools
```

```typescript
import { createCacheInspector } from '@ldesign/cache-devtools'
const inspector = createCacheInspector(cache)
```

---

## 🚀 快速开始

### 1. 选择合适的包

| 项目类型 | 安装命令 |
|---------|---------|
| 纯 JS/TS | `pnpm add @ldesign/cache-core` |
| Vue 3 | `pnpm add @ldesign/cache-vue @ldesign/cache-core` |
| React | `pnpm add @ldesign/cache-react @ldesign/cache-core` |
| Solid | `pnpm add @ldesign/cache-solid @ldesign/cache-core` |
| Svelte | `pnpm add @ldesign/cache-svelte @ldesign/cache-core` |
| Angular | `pnpm add @ldesign/cache-angular @ldesign/cache-core` |

### 2. 基础使用

```typescript
import { createCache } from '@ldesign/cache-core'

// 创建缓存实例
const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 60 * 60 * 1000, // 1小时
})

// 设置缓存
await cache.set('user', { name: '张三', age: 25 })

// 获取缓存
const user = await cache.get('user')

// 记忆函数模式
const data = await cache.remember('api-data', async () => {
  return fetch('/api/data').then(r => r.json())
})
```

---

## 📖 文档导航

### 快速开始

- [快速开始指南](./QUICK_START.md) - 5分钟上手
- [完成清单](./✅_ALL_COMPLETE.md) - 项目完成状态

### 架构设计

- [架构文档](./ARCHITECTURE.md) - 详细架构设计
- [架构对比](./STRUCTURE_COMPARISON.md) - Engine vs Cache
- [框架支持](./FULL_FRAMEWORK_SUPPORT.md) - 8 个框架详情

### 实现报告

- [重构报告](./REFACTORING_COMPLETE.md) - 重构历程
- [实现报告](./IMPLEMENTATION_COMPLETE.md) - 完整实现
- [最终总结](./FINAL_SUMMARY.md) - 项目总结

### 测试文档

- [测试报告](./TEST_REPORT.md) - 详细测试结果
- [测试总结](./TEST_COMPLETE_SUMMARY.md) - 测试完成状态

### 子包文档

- [子包总览](./packages/README.md) - 所有子包说明
- [Core 文档](./packages/core/README.md)
- [Vue 文档](./packages/vue/README.md)
- [React 文档](./packages/react/README.md)
- [Solid 文档](./packages/solid/README.md)
- [Svelte 文档](./packages/svelte/README.md)
- [Angular 文档](./packages/angular/README.md)

---

## 🧪 测试

```bash
# 运行所有测试
cd packages/cache/packages/core
pnpm test:run

# 生成覆盖率
pnpm test:coverage

# UI 模式
pnpm test:ui
```

**测试结果：** ✅ 38/38 通过

---

## 🏗️ 构建

```bash
# 构建单个包
cd packages/cache/packages/core
pnpm build

# 构建所有包
cd packages/cache
pnpm -r --filter "@ldesign/cache-*" build
```

---

## 🎯 演示示例

### Vue 3 演示

```bash
cd examples/demo-vue
pnpm dev  # http://localhost:3100
```

**功能展示：**
- ✅ 响应式缓存数据
- ✅ 自动加载和刷新
- ✅ 错误处理
- ✅ 缓存统计

### React 演示

```bash
cd examples/demo-react
pnpm dev  # http://localhost:3101
```

**功能展示：**
- ✅ React Hooks 集成
- ✅ Context Provider
- ✅ 状态管理
- ✅ 性能监控

---

## 🎓 技术栈

- **TypeScript 5.7+** - 类型安全
- **@ldesign/builder** - 统一构建
- **@ldesign/launcher** - 开发服务器
- **Vitest** - 测试框架
- **Rollup** - 打包引擎

---

## 📊 项目结构

```
packages/cache/
├── packages/           # 8 个子包
│   ├── core/          # 核心包 (38 tests ✅)
│   ├── vue/           # Vue 3 适配器
│   ├── react/         # React 适配器
│   ├── solid/         # Solid 适配器 ⭐
│   ├── svelte/        # Svelte 适配器 ⭐
│   ├── angular/       # Angular 适配器 ⭐
│   ├── lit/           # Lit 适配器
│   └── devtools/      # 开发工具
├── examples/          # 2 个演示
│   ├── demo-vue/
│   └── demo-react/
└── docs/              # 11 份文档
```

---

## 🤝 贡献

欢迎贡献代码！请确保：

1. 所有测试通过
2. 代码符合 ESLint 规范
3. 添加必要的文档
4. 更新 CHANGELOG

---

## 📄 许可证

MIT License © LDesign Team

---

## 🔗 相关链接

- [GitHub](https://github.com/ldesign/ldesign)
- [文档](https://ldesign.dev/cache)
- [问题反馈](https://github.com/ldesign/ldesign/issues)

---

**📊 项目状态**

- **架构:** ✅ 完成
- **实现:** ✅ 核心完成
- **测试:** ✅ 38/38 通过
- **文档:** ✅ 完整
- **状态:** ✅ 可以使用

---

**🎉 感谢使用 LDesign Cache！**

