# Cache vs Engine 架构对比

> 参考 @ldesign/engine 的优秀架构，完善 @ldesign/cache 的子包结构

## 📊 架构对比

### Engine 包架构（参考标杆）

```
packages/engine/
├── package.json (private: true)    # 主包不发布
├── ldesign.config.ts               # 使用 @ldesign/builder
├── src/                            # 完整源代码
│   ├── core/
│   ├── cache/
│   ├── events/
│   └── ...
└── packages/                       # 子包目录
    ├── core/                       # @ldesign/engine-core
    │   ├── src/
    │   ├── es/
    │   ├── lib/
    │   ├── dist/
    │   ├── package.json
    │   └── README.md
    ├── vue/                        # @ldesign/engine-vue
    │   ├── src/
    │   ├── examples/
    │   ├── package.json
    │   └── README.md
    ├── react/                      # @ldesign/engine-react
    ├── solid/                      # @ldesign/engine-solid
    ├── svelte/                     # @ldesign/engine-svelte
    └── angular/                    # @ldesign/engine-angular
```

### Cache 包架构（已完善）

```
packages/cache/
├── package.json                    # 主包配置
├── src/                            # 完整源代码
│   ├── core/
│   ├── engines/
│   ├── strategies/
│   └── ...
├── packages/                       # 子包目录
│   ├── core/                       # @ldesign/cache-core ✅
│   │   ├── src/
│   │   ├── package.json
│   │   ├── ldesign.config.ts      # 新增 ✨
│   │   └── README.md
│   ├── vue/                        # @ldesign/cache-vue ✅
│   │   ├── src/
│   │   ├── package.json
│   │   ├── ldesign.config.ts      # 新增 ✨
│   │   └── README.md
│   ├── react/                      # @ldesign/cache-react ✅
│   │   ├── src/
│   │   ├── package.json
│   │   ├── ldesign.config.ts      # 新增 ✨
│   │   └── README.md
│   ├── lit/                        # @ldesign/cache-lit ✅
│   │   ├── src/
│   │   ├── package.json
│   │   ├── ldesign.config.ts      # 新增 ✨
│   │   └── README.md
│   └── devtools/                   # @ldesign/cache-devtools ✅
│       ├── src/
│       ├── package.json
│       ├── ldesign.config.ts      # 新增 ✨
│       └── README.md
└── examples/                       # 演示示例
    ├── demo-vue/                   # Vue 演示 ✅
    │   ├── launcher.config.ts
    │   └── src/
    └── demo-react/                 # React 演示 ✅
        ├── launcher.config.ts
        └── src/
```

## 🎯 关键改进点

### 1. ✨ 统一的构建配置

**Before：**
```typescript
// builder.config.ts（旧格式）
export default defineConfig({
  entry: 'src/index.ts',
  output: {
    formats: ['esm', 'cjs', 'umd'],
  },
})
```

**After（参考 engine）：**
```typescript
// ldesign.config.ts（新格式）
import { defineConfig } from '@ldesign/builder'

export default defineConfig({
  input: 'src/index.ts',
  
  output: {
    format: ['esm', 'cjs', 'umd'],
    esm: {
      dir: 'es',
      preserveStructure: true,  // 🔑 保持目录结构
    },
    cjs: {
      dir: 'lib',
      preserveStructure: true,  // 🔑 保持目录结构
    },
    umd: {
      dir: 'dist',
      name: 'LDesignCacheCore',
    },
  },

  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
})
```

**优势：**
- ✅ 保持源码目录结构，支持子路径导入
- ✅ 三种格式分别输出到不同目录
- ✅ 自动生成类型定义和 sourcemap

---

### 2. 📦 细粒度的 Exports 配置

**Before：**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./es/index.js",
      "require": "./lib/index.js"
    }
  }
}
```

**After（参考 engine-core）：**
```json
{
  "exports": {
    ".": {
      "types": "./es/index.d.ts",
      "import": "./es/index.js",
      "require": "./lib/index.cjs"
    },
    "./engines": {
      "types": "./es/engines/index.d.ts",
      "import": "./es/engines/index.js",
      "require": "./lib/engines/index.cjs"
    },
    "./engines/*": {
      "types": "./es/engines/*.d.ts",
      "import": "./es/engines/*.js",
      "require": "./lib/engines/*.cjs"
    },
    "./strategies": "...",
    "./core": "...",
    "./security": "...",
    "./utils": "..."
  }
}
```

**优势：**
```typescript
// ✅ 按需导入特定模块
import { MemoryEngine } from '@ldesign/cache-core/engines'
import { LRUStrategy } from '@ldesign/cache-core/strategies'
import { SecurityManager } from '@ldesign/cache-core/security'

// 而不是
import { MemoryEngine, LRUStrategy, SecurityManager } from '@ldesign/cache-core'
```

---

### 3. 🎯 文件命名规范

| 类型 | Before | After (参考 engine) |
|------|--------|---------------------|
| 构建配置 | `builder.config.ts` | `ldesign.config.ts` ✅ |
| ESM 输出 | `es/` | `es/` ✅ |
| CJS 输出 | `lib/` | `lib/` (扩展名 `.cjs`) ✅ |
| UMD 输出 | `dist/` | `dist/` ✅ |
| 类型定义 | `dist/*.d.ts` | `es/*.d.ts` ✅ |

---

### 4. 📂 目录结构对比

#### Engine Core 结构
```
packages/engine/packages/core/
├── src/
│   ├── index.ts
│   ├── core-engine.ts
│   ├── adapters/
│   ├── cache/
│   ├── config/
│   ├── di/
│   ├── events/
│   ├── lifecycle/
│   ├── logger/
│   ├── middleware/
│   ├── plugin/
│   ├── state/
│   ├── types/
│   └── utils/
├── es/                     # ESM 输出（保持结构）
│   ├── index.js
│   ├── index.d.ts
│   ├── cache/
│   ├── config/
│   └── ...
├── lib/                    # CJS 输出（保持结构）
│   ├── index.cjs
│   ├── index.d.ts
│   ├── cache/
│   └── ...
└── dist/                   # UMD 输出
    └── index.umd.js
```

#### Cache Core 结构（已对齐）
```
packages/cache/packages/core/
├── src/
│   ├── index.ts
│   ├── core/               # 核心模块
│   ├── engines/            # 存储引擎
│   ├── strategies/         # 缓存策略
│   ├── security/           # 安全模块
│   ├── utils/              # 工具函数
│   └── types/              # 类型定义
├── es/                     # ESM（保持结构）✅
│   ├── index.js
│   ├── index.d.ts
│   ├── core/
│   ├── engines/
│   └── ...
├── lib/                    # CJS（保持结构）✅
│   ├── index.cjs
│   ├── index.d.ts
│   └── ...
└── dist/                   # UMD ✅
    └── cache-core.umd.js
```

---

### 5. 🎨 框架适配器对比

#### Engine Vue
```typescript
// @ldesign/engine-vue
export * from './adapter'
export * from './composables'
export * from './directives'

// 使用
import { useEngine } from '@ldesign/engine-vue'
import { vEngine } from '@ldesign/engine-vue/directives'
```

#### Cache Vue（已对齐）
```typescript
// @ldesign/cache-vue
export * from './composables'
export { CacheProvider }

// 使用
import { useCache } from '@ldesign/cache-vue'
import { useCacheStats } from '@ldesign/cache-vue/composables'
```

---

## 📋 完成清单

### ✅ 已完成

- [x] 创建 5 个子包（core、vue、react、lit、devtools）
- [x] 统一构建配置（ldesign.config.ts）
- [x] 细粒度 exports 配置
- [x] 完整的 package.json
- [x] TypeScript 配置
- [x] 2 个演示示例（Vue、React）
- [x] 完整的 README 文档
- [x] 架构文档（ARCHITECTURE.md）

### 🎯 下一步（可选）

- [ ] 复制实际源代码到各子包
- [ ] 实现缺失的 composables/hooks
- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 构建和验证所有子包
- [ ] 添加更多框架适配器（Solid、Svelte 等）

---

## 🚀 使用指南

### 构建

```bash
# 构建单个子包
cd packages/cache/packages/core
pnpm build

# 或使用 dev 模式（watch）
pnpm dev
```

### 运行演示

```bash
# Vue 演示
cd packages/cache/examples/demo-vue
pnpm install
pnpm dev  # http://localhost:3100

# React 演示
cd packages/cache/examples/demo-react
pnpm install
pnpm dev  # http://localhost:3101
```

### 安装使用

```bash
# 核心包
pnpm add @ldesign/cache-core

# Vue 集成
pnpm add @ldesign/cache-vue @ldesign/cache-core

# React 集成
pnpm add @ldesign/cache-react @ldesign/cache-core
```

---

## 🎓 学习要点

从 engine 包学到的关键设计模式：

1. **保持目录结构** - `preserveStructure: true`
2. **细粒度导出** - 支持子路径导入
3. **统一构建工具** - @ldesign/builder
4. **框架无关的核心** - 适配器模式
5. **完整的类型定义** - dts: true
6. **规范的命名** - ldesign.config.ts

---

## 📚 参考资源

- [@ldesign/engine](../engine) - 架构参考
- [@ldesign/builder](../../tools/builder) - 构建工具
- [@ldesign/launcher](../../tools/launcher) - 开发服务器

---

**总结：** Cache 包已成功参考 Engine 包的架构进行了完善，现在拥有清晰的子包结构、统一的构建配置和完整的文档！🎉


