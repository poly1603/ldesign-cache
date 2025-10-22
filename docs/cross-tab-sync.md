# 跨标签页同步指南

## 概述

`@ldesign/cache` 提供了强大的跨标签页同步功能，支持：

- ✅ **冲突解决机制** - Last-Write-Wins、First-Write-Wins、版本向量、自定义解决器
- ✅ **增量同步优化** - 仅同步变更数据
- ✅ **离线队列支持** - 离线时缓存变更，上线后自动同步
- ✅ **批量同步** - 累积变更批量发送，减少开销
- ✅ **同步状态管理** - 实时监控同步状态

## 基础用法

### 1. 启用基础同步

```typescript
import { CacheManager, SyncManager } from '@ldesign/cache'

// 创建缓存管理器
const cache = new CacheManager({
  defaultEngine: 'localStorage',
})

// 创建同步管理器
const sync = new SyncManager(cache, {
  enabled: true,
  channel: 'my-app-cache',  // 自定义通道名称
  debounce: 100,             // 100ms 防抖
})

// 在标签页 A 中设置数据
await cache.set('user-name', 'John Doe')

// 标签页 B 会自动接收并更新
// 无需任何代码！
```

## 冲突解决策略

### 1. Last-Write-Wins（默认）

最后写入的数据获胜，基于时间戳。

```typescript
const sync = new SyncManager(cache, {
  conflictResolution: 'last-write-wins',  // 默认策略
})

// 标签页 A: 10:00:00 设置 'user-name' = 'Alice'
// 标签页 B: 10:00:01 设置 'user-name' = 'Bob'
// 结果: 所有标签页都显示 'Bob'（后写入的获胜）
```

### 2. First-Write-Wins

第一个写入的数据获胜。

```typescript
const sync = new SyncManager(cache, {
  conflictResolution: 'first-write-wins',
})

// 标签页 A: 10:00:00 设置 'user-name' = 'Alice'
// 标签页 B: 10:00:01 设置 'user-name' = 'Bob'
// 结果: 所有标签页都显示 'Alice'（先写入的获胜）
```

### 3. 版本向量（Version Vector）

使用向量时钟检测并发冲突。

```typescript
const sync = new SyncManager(cache, {
  conflictResolution: 'version-vector',
})

// 自动跟踪每个标签页的版本号
// 检测并发修改并使用时间戳作为后备解决方案
```

### 4. 自定义冲突解决

完全自定义冲突解决逻辑。

```typescript
const sync = new SyncManager(cache, {
  conflictResolution: 'custom',
  customResolver: (local, remote) => {
    // 示例：合并对象字段
    if (typeof local.value === 'object' && typeof remote.value === 'object') {
      return {
        ...remote,
        value: {
          ...local.value,
          ...remote.value,
          // 保留最新的时间戳
          updatedAt: Math.max(local.timestamp, remote.timestamp),
        },
      }
    }
    
    // 默认行为：使用更新的数据
    return remote.timestamp > local.timestamp ? remote : local
  },
})
```

## 离线队列

自动处理离线场景，上线后重新同步。

```typescript
const sync = new SyncManager(cache, {
  enableOfflineQueue: true,
  maxOfflineQueueSize: 1000,  // 最多缓存 1000 条变更
})

// 用户离线时的操作会自动加入队列
await cache.set('offline-data', 'saved while offline')

// 重新上线时自动同步
// 监听上线事件（可选）
window.addEventListener('online', () => {
  console.log('Back online, syncing...')
})

// 查看队列状态
const status = sync.getSyncStatus()
console.log(`Queued messages: ${status.queueSize}`)
```

## 批量同步

累积变更批量发送，减少网络开销。

```typescript
const sync = new SyncManager(cache, {
  batchInterval: 500,  // 每 500ms 批量发送一次
})

// 快速连续的更新会被批量处理
await cache.set('key1', 'value1')
await cache.set('key2', 'value2')
await cache.set('key3', 'value3')
// 这些更新会在 500ms 后一次性同步
```

## 监听同步事件

### 1. 监听同步消息

```typescript
sync.on('sync', (message) => {
  console.log('Sync message:', message)
  console.log('Type:', message.type)
  console.log('Key:', message.key)
  console.log('Timestamp:', message.timestamp)
})
```

### 2. 监听冲突事件

```typescript
sync.on('conflict', (message) => {
  console.warn('Conflict detected!')
  console.log('Key:', message.key)
  console.log('Local version:', message.data?.version)
  
  // 可以通知用户或记录日志
  notifyUser('数据冲突已自动解决')
})
```

## 同步状态监控

```typescript
// 获取同步状态
const status = sync.getSyncStatus()

console.log('在线状态:', status.isOnline)
console.log('发送消息数:', status.stats.sent)
console.log('接收消息数:', status.stats.received)
console.log('冲突数:', status.stats.conflicts)
console.log('已解决冲突:', status.stats.resolved)
console.log('队列大小:', status.queueSize)
console.log('向量时钟:', status.vectorClock)
```

### 实时监控示例

```typescript
// 每秒更新一次状态
setInterval(() => {
  const status = sync.getSyncStatus()
  
  document.getElementById('online-status').textContent = 
    status.isOnline ? '在线' : '离线'
  
  document.getElementById('sync-stats').textContent = 
    `发送: ${status.stats.sent} | 接收: ${status.stats.received} | 冲突: ${status.stats.conflicts}`
  
  document.getElementById('queue-size').textContent = 
    `队列: ${status.queueSize}`
}, 1000)
```

## 完整示例

### 多标签页协同编辑

```typescript
import { CacheManager, SyncManager } from '@ldesign/cache'

// 创建缓存和同步管理器
const cache = new CacheManager({
  defaultEngine: 'localStorage',
  keyPrefix: 'collab-edit',
})

const sync = new SyncManager(cache, {
  enabled: true,
  channel: 'collab-editor',
  conflictResolution: 'custom',
  customResolver: (local, remote) => {
    // 合并编辑器状态
    return {
      ...remote,
      value: {
        content: remote.value.content,  // 使用远程内容
        cursor: local.value.cursor,     // 保留本地光标位置
        selection: local.value.selection,
      },
    }
  },
  enableOfflineQueue: true,
  batchInterval: 200,  // 200ms 批量同步
})

// 监听冲突并通知用户
sync.on('conflict', (message) => {
  showNotification('检测到其他用户的编辑，已自动合并')
})

// 监听同步状态
sync.on('sync', (message) => {
  if (message.type === 'set' && message.key === 'document-content') {
    // 更新编辑器内容
    updateEditor(message.value)
  }
})

// 保存文档
async function saveDocument(content) {
  await cache.set('document-content', {
    content,
    cursor: editor.getCursorPosition(),
    selection: editor.getSelection(),
    updatedAt: Date.now(),
  })
}

// 定期保存
setInterval(() => {
  const content = editor.getContent()
  saveDocument(content)
}, 1000)  // 每秒保存一次
```

### 购物车同步

```typescript
import { CacheManager, SyncManager } from '@ldesign/cache'

const cache = new CacheManager({
  defaultEngine: 'localStorage',
})

const sync = new SyncManager(cache, {
  enabled: true,
  channel: 'shopping-cart',
  conflictResolution: 'custom',
  customResolver: (local, remote) => {
    // 合并购物车：使用更多数量
    const localCart = local.value
    const remoteCart = remote.value
    
    const mergedCart = { ...remoteCart }
    
    for (const [itemId, quantity] of Object.entries(localCart)) {
      const remoteQty = remoteCart[itemId] || 0
      mergedCart[itemId] = Math.max(quantity, remoteQty)
    }
    
    return {
      ...remote,
      value: mergedCart,
    }
  },
  enableOfflineQueue: true,
})

// 添加商品到购物车
async function addToCart(itemId, quantity = 1) {
  const cart = await cache.get('cart') || {}
  cart[itemId] = (cart[itemId] || 0) + quantity
  await cache.set('cart', cart)
}

// 监听购物车变更
sync.on('sync', (message) => {
  if (message.key === 'cart') {
    updateCartUI(message.value)
    showNotification('购物车已在其他标签页更新')
  }
})
```

## 性能优化建议

### 1. 使用防抖

对高频更新使用防抖：

```typescript
const sync = new SyncManager(cache, {
  debounce: 300,  // 300ms 防抖
})
```

### 2. 批量同步

累积多个变更一次同步：

```typescript
const sync = new SyncManager(cache, {
  batchInterval: 500,  // 500ms 批量
})
```

### 3. 选择性同步

只同步需要的引擎：

```typescript
const sync = new SyncManager(cache, {
  engines: ['localStorage'],  // 只同步 localStorage
  events: ['set', 'remove'],  // 只同步 set 和 remove 事件
})
```

### 4. 离线队列大小

根据应用调整队列大小：

```typescript
const sync = new SyncManager(cache, {
  enableOfflineQueue: true,
  maxOfflineQueueSize: 500,  // 根据需要调整
})
```

## 最佳实践

### 1. 避免频繁的大数据同步

```typescript
// ❌ 不好：频繁同步大对象
for (let i = 0; i < 100; i++) {
  await cache.set('large-data', { /* 大对象 */ })
}

// ✅ 好：批量同步或使用防抖
const sync = new SyncManager(cache, {
  batchInterval: 1000,
  debounce: 300,
})
```

### 2. 合理选择冲突解决策略

```typescript
// 用户设置：使用 last-write-wins
const settingsSync = new SyncManager(settingsCache, {
  conflictResolution: 'last-write-wins',
})

// 协同编辑：使用自定义合并
const editorSync = new SyncManager(editorCache, {
  conflictResolution: 'custom',
  customResolver: mergeEditorState,
})
```

### 3. 监控同步状态

```typescript
// 定期检查同步健康状态
setInterval(() => {
  const status = sync.getSyncStatus()
  
  // 冲突率过高时发出警告
  if (status.stats.conflicts > status.stats.sent * 0.1) {
    console.warn('High conflict rate detected')
  }
  
  // 队列积压过多时发出警告
  if (status.queueSize > 100) {
    console.warn('Large offline queue:', status.queueSize)
  }
}, 5000)
```

### 4. 清理与销毁

```typescript
// 组件卸载或页面关闭时清理
window.addEventListener('beforeunload', () => {
  sync.destroy()
})

// Vue 组件
onUnmounted(() => {
  sync.destroy()
})

// React 组件
useEffect(() => {
  return () => sync.destroy()
}, [])
```

## 故障排除

### 同步不工作

1. 检查是否在同域下：
```typescript
// BroadcastChannel 只在同域下工作
console.log('Origin:', window.location.origin)
```

2. 检查浏览器支持：
```typescript
if (typeof BroadcastChannel === 'undefined') {
  console.warn('BroadcastChannel not supported, falling back to storage events')
}
```

### 冲突过多

1. 增加防抖时间：
```typescript
const sync = new SyncManager(cache, {
  debounce: 500,  // 增加到 500ms
})
```

2. 使用批量同步：
```typescript
const sync = new SyncManager(cache, {
  batchInterval: 1000,
})
```

### 离线队列积压

1. 增加队列大小：
```typescript
const sync = new SyncManager(cache, {
  maxOfflineQueueSize: 2000,
})
```

2. 清空队列：
```typescript
if (confirm('清空离线队列？')) {
  sync.clearOfflineQueue()
}
```

## 浏览器兼容性

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| BroadcastChannel | 54+ | 38+ | 15.4+ | 79+ |
| Storage Events | ✅ | ✅ | ✅ | ✅ |
| Online/Offline Events | ✅ | ✅ | ✅ | ✅ |

**注意**: 如果 BroadcastChannel 不可用，会自动回退到 storage events。

## 总结

跨标签页同步功能提供了：

- ✅ **自动同步** - 无需手动编码
- ✅ **冲突解决** - 多种策略可选
- ✅ **离线支持** - 自动队列和重试
- ✅ **批量优化** - 减少开销
- ✅ **状态监控** - 实时了解同步情况

通过合理配置和使用，可以构建出色的多标签页协同体验！


