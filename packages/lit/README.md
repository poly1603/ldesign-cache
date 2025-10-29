# @ldesign/cache-lit

> LDesign Cache 的 Lit 集成包 - 提供指令和混入

[![npm version](https://img.shields.io/npm/v/@ldesign/cache-lit.svg)](https://www.npmjs.com/package/@ldesign/cache-lit)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@ldesign/cache-lit)](https://bundlephobia.com/package/@ldesign/cache-lit)
[![license](https://img.shields.io/npm/l/@ldesign/cache-lit.svg)](https://github.com/ldesign/ldesign/blob/main/LICENSE)

## 特性

- 🎯 **Lit 指令** - 提供缓存相关的 Lit 指令
- 🔀 **Mixin 支持** - 为组件添加缓存能力
- 🎨 **声明式** - 使用指令声明式管理缓存
- ⚡ **高性能** - 优化的渲染性能
- 🎨 **TypeScript** - 完整的类型定义

## 安装

```bash
# npm
npm install @ldesign/cache-lit @ldesign/cache-core lit

# yarn
yarn add @ldesign/cache-lit @ldesign/cache-core lit

# pnpm
pnpm add @ldesign/cache-lit @ldesign/cache-core lit
```

## 快速开始

### 使用 Mixin

```typescript
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { CacheMixin } from '@ldesign/cache-lit'

@customElement('user-profile')
export class UserProfile extends CacheMixin(LitElement) {
  @property({ type: Object })
  user: any = null

  async connectedCallback() {
    super.connectedCallback()
    
    // 使用 cache 实例（由 Mixin 提供）
    const cached = await this.cache.get('user-data')
    if (cached) {
      this.user = cached
    } else {
      const data = await fetch('/api/user').then(r => r.json())
      await this.cache.set('user-data', data, { ttl: 60000 })
      this.user = data
    }
  }

  render() {
    return html`
      <div>
        ${this.user ? html`
          <h1>${this.user.name}</h1>
          <p>Age: ${this.user.age}</p>
        ` : html`
          <p>Loading...</p>
        `}
      </div>
    `
  }
}
```

### 使用指令

```typescript
import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { cache, cacheKey } from '@ldesign/cache-lit'

@customElement('cached-component')
export class CachedComponent extends LitElement {
  @state()
  userId = '123'

  render() {
    // 使用 cache 指令缓存异步数据
    return html`
      <div>
        ${cache(
          async () => {
            const res = await fetch(`/api/users/${this.userId}`)
            return res.json()
          },
          cacheKey(`user-${this.userId}`),
          html`<p>Loading...</p>`
        )}
      </div>
    `
  }
}
```

### Cache Controller Mixin

```typescript
import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { CacheControllerMixin } from '@ldesign/cache-lit'

@customElement('smart-cache-component')
export class SmartCacheComponent extends CacheControllerMixin(LitElement, {
  keyPrefix: 'my-app',
  defaultTTL: 60000,
  autoCleanup: true,
}) {
  async loadData() {
    // 自动添加前缀并缓存
    return this.cache.remember('user-data', async () => {
      return fetch('/api/user').then(r => r.json())
    })
  }

  render() {
    return html`<div>Smart Cache Component</div>`
  }
}
```

### 条件缓存指令

```typescript
import { html } from 'lit'
import { cacheUntil } from '@ldesign/cache-lit'

// 缓存直到条件满足
html`
  ${cacheUntil(
    fetchExpensiveData(),
    () => Date.now() > deadline,
    html`<loading-spinner></loading-spinner>`
  )}
`
```

## API

### 指令

#### cache(fn, key, placeholder?)

缓存异步函数的结果。

**参数：**
- `fn: () => Promise<any>` - 异步函数
- `key: string | Directive` - 缓存键或 cacheKey 指令
- `placeholder?: unknown` - 加载时的占位内容

#### cacheKey(key)

生成缓存键的指令。

#### cacheUntil(fn, condition, placeholder?)

缓存直到条件满足。

### Mixin

#### CacheMixin(Base)

为 Lit 元素添加缓存功能。

**提供属性：**
- `cache: CacheManager` - 缓存管理器实例

**提供方法：**
- `initCache()` - 初始化缓存
- `cleanupCache()` - 清理缓存

#### CacheControllerMixin(Base, options?)

带控制器的缓存 Mixin。

**选项：**
- `keyPrefix?: string` - 键前缀
- `defaultTTL?: number` - 默认 TTL
- `autoCleanup?: boolean` - 自动清理

## 许可证

MIT License © LDesign Team


