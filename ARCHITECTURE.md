# @ldesign/cache 架构文档

> 参考 @ldesign/engine 的优秀架构设计

## 📐 整体架构

采用 **主包 + 子包** 混合架构，模块化设计，按需引入。

```
@ldesign/cache (主包 - private)
├── packages/
│   ├── core/          → @ldesign/cache-core
│   ├── vue/           → @ldesign/cache-vue
│   ├── react/         → @ldesign/cache-react
│   ├── lit/           → @ldesign/cache-lit
│   └── devtools/      → @ldesign/cache-devtools
└── examples/
    ├── demo-vue/      → Vue 演示应用
    └── demo-react/    → React 演示应用
```

## 🎯 设计原则

### 1. 框架无关的核心（@ldesign/cache-core）

核心包完全独立于任何 UI 框架，提供纯 JavaScript/TypeScript API。

**核心功能：**
- 多存储引擎支持
- 缓存管理器
- 智能策略
- 性能监控
- 跨标签页/设备同步
- 安全加密

### 2. 框架适配器模式

每个框架适配器都依赖于核心包，提供该框架特有的集成方式。

**Vue 适配器：**
- Composition API (useCache, useCacheStats)
- Provider 组件
- 响应式数据

**React 适配器：**
- React Hooks
- Context Provider
- 自动状态管理

**Lit 适配器：**
- 自定义指令
- Mixin 模式
- Web Components 友好

### 3. 细粒度导出

参考 engine 包，支持子路径导入，按需加载：

```typescript
// 导入整个包
import { createCache } from '@ldesign/cache-core'

// 导入特定模块
import { MemoryEngine } from '@ldesign/cache-core/engines'
import { LRUStrategy } from '@ldesign/cache-core/strategies'
import { SecurityManager } from '@ldesign/cache-core/security'
```

## 📦 子包详细设计

### @ldesign/cache-core

```typescript
// 核心导出
export { CacheManager, createCache }
export { StorageEngineFactory }

// 引擎
export * from './engines'
  - MemoryEngine
  - LocalStorageEngine
  - SessionStorageEngine
  - IndexedDBEngine
  - CookieEngine
  - OPFSEngine

// 策略
export * from './strategies'
  - LRUStrategy
  - LFUStrategy
  - FIFOStrategy
  - AdaptiveStrategy

// 核心模块
export * from './core'
  - PerformanceMonitor
  - SyncManager
  - VersionManager
  - TagManager

// 安全
export * from './security'
  - AESCrypto
  - KeyObfuscator
  - SecurityManager

// 工具
export * from './utils'
  - Serializer
  - Compressor
  - ErrorHandler
```

**Exports 配置：**
```json
{
  "exports": {
    ".": "./es/index.js",
    "./engines": "./es/engines/index.js",
    "./engines/*": "./es/engines/*.js",
    "./strategies": "./es/strategies/index.js",
    "./strategies/*": "./es/strategies/*.js",
    "./core": "./es/core/index.js",
    "./core/*": "./es/core/*.js",
    "./security": "./es/security/index.js",
    "./security/*": "./es/security/*.js",
    "./utils": "./es/utils/index.js",
    "./utils/*": "./es/utils/*.js"
  }
}
```

### @ldesign/cache-vue

```typescript
// Composables
export * from './composables'
  - useCache
  - useCacheKey
  - useCacheKeys
  - useCacheStats

// Provider
export { CacheProvider }

// Helpers
export * from './helpers'
```

**Exports 配置：**
```json
{
  "exports": {
    ".": "./es/index.js",
    "./composables": "./es/composables/index.js",
    "./composables/*": "./es/composables/*.js"
  }
}
```

### @ldesign/cache-react

```typescript
// Hooks
export * from './hooks'
  - useCache
  - useCacheKey
  - useCacheKeys
  - useCacheStats

// Provider
export { CacheProvider }

// Context
export { useCacheContext }
```

**Exports 配置：**
```json
{
  "exports": {
    ".": "./es/index.js",
    "./hooks": "./es/hooks/index.js",
    "./hooks/*": "./es/hooks/*.js"
  }
}
```

## 🏗️ 构建配置

所有子包使用统一的 `@ldesign/builder` 构建：

```typescript
// ldesign.config.ts
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  
  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true, // 保持目录结构
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,
    },
    umd: {
      dir: 'dist',
      name: 'PackageName',
    },
  },

  dts: true,        // 生成类型定义
  sourcemap: true,  // 生成 sourcemap
  minify: false,    // 开发版不压缩
  clean: true,      // 构建前清理
})
```

## 📂 目录结构标准

每个子包遵循统一的目录结构：

```
packages/core/
├── src/
│   ├── index.ts           # 主入口
│   ├── core/              # 核心模块
│   ├── engines/           # 存储引擎
│   ├── strategies/        # 缓存策略
│   ├── security/          # 安全模块
│   ├── utils/             # 工具函数
│   └── types/             # 类型定义
├── es/                    # ESM 输出
├── lib/                   # CJS 输出
├── dist/                  # UMD 输出
├── package.json
├── ldesign.config.ts      # 构建配置
├── tsconfig.json
└── README.md
```

## 🔄 依赖关系

```
@ldesign/cache-core (基础包)
    ↓ 被依赖
    ├── @ldesign/cache-vue
    ├── @ldesign/cache-react
    ├── @ldesign/cache-lit
    └── @ldesign/cache-devtools
```

**依赖规则：**
- ✅ 框架适配器依赖 core
- ✅ 使用 `workspace:*` 引用
- ❌ 框架适配器之间不互相依赖
- ❌ core 不依赖任何框架

## 🎨 使用示例

### 独立使用核心包

```typescript
import { createCache } from '@ldesign/cache-core'
import { MemoryEngine } from '@ldesign/cache-core/engines'
import { LRUStrategy } from '@ldesign/cache-core/strategies'

const cache = createCache({
  engines: [new MemoryEngine()],
  strategy: new LRUStrategy(),
})
```

### Vue 集成

```typescript
import { useCache } from '@ldesign/cache-vue'

const { data, loading } = useCache('key', {
  fetcher: () => fetchData(),
})
```

### React 集成

```typescript
import { useCache } from '@ldesign/cache-react'

const { data, loading } = useCache('key', {
  fetcher: async () => fetchData(),
})
```

## 📊 性能优化

1. **Tree-shaking 友好**
   - ESM 格式
   - 细粒度导出
   - 保持目录结构

2. **按需加载**
   - 支持子路径导入
   - 避免加载整个库

3. **多格式支持**
   - ESM：现代打包工具
   - CJS：Node.js 兼容
   - UMD：浏览器直接引入

## 🚀 构建和发布

### 开发模式

```bash
# 监听模式
cd packages/core
pnpm dev
```

### 构建

```bash
# 构建单个包
pnpm build

# 构建所有包
pnpm -r --filter "@ldesign/cache-*" build
```

### 发布

```bash
# 版本管理
pnpm changeset

# 发布
pnpm publish -r
```

## 📝 最佳实践

1. **保持核心包纯净**
   - 不依赖任何 UI 框架
   - 使用纯 TypeScript/JavaScript

2. **框架适配器轻量化**
   - 只做框架集成
   - 核心逻辑在 core 包

3. **类型定义完整**
   - 所有公开 API 都有类型
   - 使用 `dts: true` 生成声明文件

4. **文档齐全**
   - 每个包都有 README
   - 提供使用示例
   - API 文档完整

5. **测试覆盖**
   - 单元测试
   - 集成测试
   - E2E 测试

---

**参考：**
- [@ldesign/engine](../engine) - 架构灵感来源
- [@ldesign/builder](../../tools/builder) - 构建工具
- [@ldesign/launcher](../../tools/launcher) - 开发服务器


