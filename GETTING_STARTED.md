# @ldesign/cache 快速上手指南

欢迎使用 @ldesign/cache！这个指南将帮助你快速上手。

## 📦 安装

```bash
# 使用 pnpm（推荐）
pnpm add @ldesign/cache

# 使用 npm
npm install @ldesign/cache

# 使用 yarn
yarn add @ldesign/cache
```

## 🚀 5分钟快速入门

### 1. 创建缓存实例

```typescript
import { createCache } from '@ldesign/cache'

const cache = createCache({
  defaultEngine: 'localStorage',
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
})
```

### 2. 基础操作

```typescript
// 设置缓存
await cache.set('username', '张三')

// 获取缓存
const username = await cache.get('username')
console.log(username) // '张三'

// 检查是否存在
if (await cache.has('username')) {
  console.log('缓存存在')
}

// 删除缓存
await cache.remove('username')

// 清空所有缓存
await cache.clear()
```

### 3. 存储复杂对象

```typescript
// 存储对象
await cache.set('user', {
  id: 1,
  name: '张三',
  email: 'zhangsan@example.com',
  preferences: {
    theme: 'dark',
    language: 'zh-CN',
  },
})

// 获取对象（带类型）
interface User {
  id: number
  name: string
  email: string
  preferences?: {
    theme: string
    language: string
  }
}

const user = await cache.get<User>('user')
if (user) {
  console.log(user.name) // '张三'
  console.log(user.preferences?.theme) // 'dark'
}
```

### 4. 设置过期时间

```typescript
// 5秒后过期
await cache.set('temp-data', 'temporary', {
  ttl: 5000,
})

// 等待6秒后
await new Promise(resolve => setTimeout(resolve, 6000))
const data = await cache.get('temp-data')
console.log(data) // null（已过期）
```

## 🎯 常见场景

### 场景 1: 用户偏好设置

```typescript
// 保存用户设置
await cache.set('user-preferences', {
  theme: 'dark',
  fontSize: 14,
  language: 'zh-CN',
})

// 读取设置
const prefs = await cache.get('user-preferences')
document.body.classList.add(prefs.theme)
```

### 场景 2: API 响应缓存

```typescript
async function getUsers() {
  // 先尝试从缓存获取
  let users = await cache.get('users-list')

  if (!users) {
    // 缓存未命中，从 API 获取
    const response = await fetch('/api/users')
    users = await response.json()

    // 缓存5分钟
    await cache.set('users-list', users, {
      ttl: 5 * 60 * 1000,
    })
  }

  return users
}
```

### 场景 3: 表单草稿保存

```typescript
// 监听表单输入
const form = document.querySelector('form')
let saveTimer: number | null = null

form.addEventListener('input', () => {
  // 防抖：1秒后保存
  if (saveTimer) clearTimeout(saveTimer)

  saveTimer = setTimeout(async () => {
    const formData = new FormData(form)
    const data = Object.fromEntries(formData)

    await cache.set('form-draft', data)
    console.log('草稿已保存')
  }, 1000)
})

// 页面加载时恢复草稿
window.addEventListener('load', async () => {
  const draft = await cache.get('form-draft')
  if (draft) {
    // 恢复表单数据
    Object.entries(draft).forEach(([key, value]) => {
      const input = form.querySelector(`[name="${key}"]`)
      if (input) input.value = value
    })
  }
})
```

## 🎨 Vue 3 集成

### 基础用法

```vue
<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误: {{ error.message }}</div>
    <div v-else>
      <h1>{{ userInfo?.name }}</h1>
      <button @click="refresh">刷新</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCache } from '@ldesign/cache/vue'

// 使用组合式函数
const {
  data: userInfo,
  loading,
  error,
  refresh,
} = useCache('user-info', {
  fetcher: () => fetch('/api/user').then(r => r.json()),
  ttl: 5 * 60 * 1000, // 5分钟
})
</script>
```

### 实时统计

```vue
<template>
  <div>
    <p>命中率: {{ stats.hitRate }}%</p>
    <p>总操作: {{ stats.totalOps }}</p>
  </div>
</template>

<script setup lang="ts">
import { useCacheStats } from '@ldesign/cache/vue'

const stats = useCacheStats()
</script>
```

## 🧠 智能策略

启用智能策略后，系统会自动选择最优存储引擎：

```typescript
import { createSmartCache } from '@ldesign/cache/presets'

const cache = createSmartCache()

// 小数据 → localStorage
await cache.set('theme', 'dark')

// 大数据 → IndexedDB
await cache.set('large-dataset', bigArray)

// 短期数据 → Memory
await cache.set('temp', data, { ttl: 1000 })
```

## 🔒 安全加密

```typescript
import { createSecureCache } from '@ldesign/cache/presets'

const cache = createSecureCache()

// 数据会自动加密
await cache.set('password', 'my-secret-password')

// 键名会被混淆
await cache.set('api-key', 'abc123')
```

## ⚡ 批量操作

```typescript
// 批量设置（性能提升 50-200%）
await cache.mset([
  { key: 'user1', value: { name: '张三' } },
  { key: 'user2', value: { name: '李四' } },
  { key: 'user3', value: { name: '王五' } },
])

// 批量获取
const users = await cache.mget(['user1', 'user2', 'user3'])

// 批量删除
await cache.mremove(['user1', 'user2', 'user3'])
```

## 📦 命名空间

```typescript
const cache = createCache()

// 用户数据
await cache.set('user:123:profile', userProfile)
await cache.set('user:123:settings', userSettings)

// 产品数据
await cache.set('product:456:info', productInfo)
await cache.set('product:456:reviews', reviews)

// 清空用户命名空间
const keys = await cache.keys()
const userKeys = keys.filter(k => k.startsWith('user:123:'))
await cache.mremove(userKeys)
```

## 📚 下一步

现在你已经掌握了基础用法，可以继续学习：

- **[完整文档](./docs/index.md)** - 查看详细文档
- **[API 参考](./docs/api/cache-manager.md)** - 完整 API 文档
- **[示例代码](./examples/README.md)** - 更多实用示例
- **[最佳实践](./docs/guide/best-practices.md)** - 性能优化技巧

## 🎁 预设配置

快速开始使用预设配置：

```typescript
import {
  createFastCache,      // 快速缓存（Memory）
  createPersistentCache, // 持久缓存（IndexedDB）
  createSecureCache,    // 安全缓存（加密）
  createSmartCache,     // 智能缓存（自动选择）
} from '@ldesign/cache/presets'

// 根据需求选择
const cache = createSmartCache()
```

## 💡 提示

1. **TypeScript 支持**：所有 API 都有完整的类型定义
2. **按需导入**：使用 ES modules 自动 tree-shaking
3. **Vue 3 集成**：提供丰富的组合式函数
4. **性能优化**：使用批量操作提升性能
5. **安全第一**：敏感数据使用加密存储

## 🆘 遇到问题？

- 查看 [常见问题](./docs/guide/faq.md)
- 查看 [故障排除](./docs/guide/troubleshooting.md)
- 提交 [Issue](https://github.com/ldesign/ldesign/issues)

## 📖 完整示例

查看 [examples](./examples) 目录获取更多完整示例，包括：

- 基础功能演示
- 智能策略演示
- 安全加密演示
- Vue 集成演示
- 跨标签页同步演示
- 命名空间演示
- 表单自动保存演示
- 性能监控演示

祝你使用愉快！🎉

