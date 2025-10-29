# @ldesign/cache-svelte

> LDesign Cache 的 Svelte 集成包 - Stores 和 Context

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-svelte.svg)](https://www.npmjs.com/package/@ldesign/cache-svelte)
[![license](https://img.shields.io/npm/l/@ldesign/cache-svelte.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **Svelte Stores** - 完整的 Svelte stores 支持
- 🔄 **响应式** - 自动追踪缓存变化
- 📦 **Context API** - 全局缓存实例管理
- ⚡ **轻量级** - 小巧的打包体积
- 🎨 **TypeScript** - 完整的类型定义

## 安装

```bash
pnpm add @ldesign/cache-svelte @ldesign/cache-core
```

## 快速开始

```svelte
<script lang="ts">
  import { cacheStore } from '@ldesign/cache-svelte'

  const userCache = cacheStore('user', {
    fetcher: async () => {
      const res = await fetch('/api/user')
      return res.json()
    },
  })
</script>

{#if $userCache.loading}
  <p>Loading...</p>
{:else if $userCache.error}
  <p>Error: {$userCache.error.message}</p>
{:else}
  <p>User: {$userCache.data?.name}</p>
  <button on:click={() => userCache.refresh()}>Refresh</button>
{/if}
```

## 许可证

MIT License © LDesign Team

