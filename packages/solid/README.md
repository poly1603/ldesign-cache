# @ldesign/cache-solid

> LDesign Cache 的 Solid.js 集成包 - 响应式缓存管理

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-solid.svg)](https://www.npmjs.com/package/@ldesign/cache-solid)
[![license](https://img.shields.io/npm/l/@ldesign/cache-solid.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **Solid.js 集成** - 完整的 Solid.js 响应式支持
- 🔄 **响应式** - 自动追踪缓存变化
- 📦 **Provider 模式** - 全局缓存实例注入
- ⚡ **高性能** - 利用 Solid.js 的细粒度响应式
- 🎨 **TypeScript** - 完整的类型定义

## 安装

```bash
pnpm add @ldesign/cache-solid @ldesign/cache-core
```

## 快速开始

```tsx
import { createCache } from '@ldesign/cache-solid'

function UserProfile() {
  const { data, loading, refresh } = createCache('user', {
    fetcher: async () => {
      const res = await fetch('/api/user')
      return res.json()
    },
  })

  return (
    <div>
      {loading() ? 'Loading...' : data()?.name}
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

## 许可证

MIT License © LDesign Team

