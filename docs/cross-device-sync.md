# 跨设备同步指南

## 概述

`@ldesign/cache` 提供了强大的跨设备同步功能，支持通过服务器实现多设备间的缓存同步。

### 支持的传输层

- ✅ **WebSocket** - 实时双向通信（推荐）
- ✅ **HTTP 长轮询** - 广泛兼容的后备方案
- ✅ **Server-Sent Events (SSE)** - 服务器推送

### 核心特性

- 🔄 **自动重连** - 断线后自动重连，指数退避
- 💾 **消息队列** - 离线时缓存消息，上线后批量发送
- 💓 **心跳机制** - 保持连接活跃
- 🔐 **认证支持** - Token 认证
- 📊 **状态监控** - 实时连接状态

## 快速开始

### 1. WebSocket 同步（推荐）

```typescript
import { CacheManager, RemoteSyncManager } from '@ldesign/cache'

// 创建缓存管理器
const cache = new CacheManager({
  defaultEngine: 'localStorage',
})

// 创建远程同步管理器
const remoteSync = new RemoteSyncManager({
  serverUrl: 'ws://your-server.com/cache-sync',
  transport: 'websocket',
  deviceId: 'user-device-123',  // 可选，自动生成
  authToken: 'your-auth-token',
  heartbeatInterval: 30000,      // 30秒心跳
  reconnectDelay: 1000,          // 1秒重连延迟
  maxReconnectAttempts: 10,
})

// 连接到服务器
await remoteSync.connect()

// 监听远程消息
remoteSync.on('message', async (message) => {
  if (message.type === 'sync' && message.data) {
    const { key, syncData, operation } = message.data
    
    if (operation === 'set') {
      await cache.set(key, syncData.value)
    }
    else if (operation === 'remove') {
      await cache.remove(key)
    }
  }
})

// 监听连接状态
remoteSync.on('state', (state) => {
  console.log('Connection state:', state)
  
  if (state === 'connected') {
    console.log('✅ 已连接到同步服务器')
  }
  else if (state === 'disconnected') {
    console.log('❌ 与服务器断开连接')
  }
})

// 同步本地数据到其他设备
cache.on('set', async (event) => {
  await remoteSync.sync(event.key, {
    value: event.value,
    timestamp: event.timestamp,
    version: 1,
    source: 'device-123',
  }, 'set')
})
```

### 2. HTTP 长轮询

```typescript
const remoteSync = new RemoteSyncManager({
  serverUrl: 'https://your-server.com/api/cache-sync',
  transport: 'polling',
  deviceId: 'user-device-123',
  authToken: 'your-auth-token',
  heartbeatInterval: 5000,  // 5秒轮询一次
})

await remoteSync.connect()
```

### 3. Server-Sent Events

```typescript
const remoteSync = new RemoteSyncManager({
  serverUrl: 'https://your-server.com/api/cache-stream',
  transport: 'sse',
  deviceId: 'user-device-123',
  authToken: 'your-auth-token',
})

await remoteSync.connect()
```

## 完整示例

### 多设备协同编辑

```typescript
import { CacheManager, RemoteSyncManager, SyncManager } from '@ldesign/cache'

class MultiDeviceCache {
  private cache: CacheManager
  private localSync: SyncManager
  private remoteSync: RemoteSyncManager
  
  constructor(userId: string, authToken: string) {
    // 本地缓存
    this.cache = new CacheManager({
      defaultEngine: 'localStorage',
      keyPrefix: `user-${userId}`,
    })
    
    // 跨标签页同步
    this.localSync = new SyncManager(this.cache, {
      enabled: true,
      channel: `user-${userId}-cache`,
      conflictResolution: 'last-write-wins',
      enableOfflineQueue: true,
      batchInterval: 200,
    })
    
    // 跨设备同步
    this.remoteSync = new RemoteSyncManager({
      serverUrl: `wss://api.example.com/sync/${userId}`,
      transport: 'websocket',
      authToken,
      heartbeatInterval: 30000,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
    })
    
    this.setupSync()
  }
  
  /**
   * 设置同步
   */
  private setupSync(): void {
    // 本地变更 -> 远程同步
    this.cache.on('set', async (event) => {
      const state = this.remoteSync.getConnectionState()
      
      if (state === 'connected') {
        await this.remoteSync.sync(event.key, {
          value: event.value,
          timestamp: event.timestamp,
          version: 1,
          source: this.remoteSync['deviceId'],
        }, 'set')
      }
    })
    
    this.cache.on('remove', async (event) => {
      const state = this.remoteSync.getConnectionState()
      
      if (state === 'connected') {
        await this.remoteSync.sync(event.key, {
          value: null,
          timestamp: event.timestamp,
          version: 1,
          source: this.remoteSync['deviceId'],
        }, 'remove')
      }
    })
    
    // 远程变更 -> 本地应用
    this.remoteSync.on('message', async (message) => {
      if (message.type === 'sync') {
        if (message.data) {
          const { key, syncData, operation } = message.data
          
          if (operation === 'set') {
            await this.cache.set(key, syncData.value)
          }
          else if (operation === 'remove') {
            await this.cache.remove(key)
          }
        }
        else if (message.batch) {
          // 批量同步
          for (const item of message.batch) {
            if (item.operation === 'set') {
              await this.cache.set(item.key, item.syncData.value)
            }
            else if (item.operation === 'remove') {
              await this.cache.remove(item.key)
            }
          }
        }
      }
    })
  }
  
  /**
   * 初始化连接
   */
  async initialize(): Promise<void> {
    await this.remoteSync.connect()
    console.log('✅ 跨设备同步已启用')
  }
  
  /**
   * 设置数据
   */
  async set(key: string, value: any, options?: any): Promise<void> {
    await this.cache.set(key, value, options)
  }
  
  /**
   * 获取数据
   */
  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key)
  }
  
  /**
   * 获取同步状态
   */
  getStatus(): {
    connectionState: string
    localSync: any
  } {
    return {
      connectionState: this.remoteSync.getConnectionState(),
      localSync: this.localSync.getSyncStatus(),
    }
  }
  
  /**
   * 销毁
   */
  destroy(): void {
    this.remoteSync.destroy()
    this.localSync.destroy()
  }
}

// 使用
const multiDeviceCache = new MultiDeviceCache('user-123', 'auth-token-xyz')
await multiDeviceCache.initialize()

// 设置数据（会自动同步到所有设备）
await multiDeviceCache.set('user-preferences', {
  theme: 'dark',
  language: 'zh-CN',
})

// 在另一台设备上会自动接收到更新
```

## 服务器端实现示例

### Node.js WebSocket 服务器

```javascript
// server.js
const WebSocket = require('ws')
const express = require('express')

const app = express()
const server = require('http').createServer(app)
const wss = new WebSocket.Server({ server })

// 存储所有连接的设备
const devices = new Map()

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const deviceId = url.searchParams.get('deviceId')
  const token = url.searchParams.get('token')
  
  // 验证 token
  if (!isValidToken(token)) {
    ws.close(1008, 'Unauthorized')
    return
  }
  
  console.log(`Device connected: ${deviceId}`)
  devices.set(deviceId, ws)
  
  // 接收消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data)
      
      if (message.type === 'heartbeat') {
        // 响应心跳
        ws.send(JSON.stringify({
          type: 'ack',
          deviceId: 'server',
          timestamp: Date.now(),
        }))
        return
      }
      
      if (message.type === 'sync') {
        // 广播到其他设备
        for (const [id, socket] of devices) {
          if (id !== deviceId && socket.readyState === WebSocket.OPEN) {
            socket.send(data)
          }
        }
      }
    }
    catch (error) {
      console.error('Error handling message:', error)
    }
  })
  
  // 连接关闭
  ws.on('close', () => {
    console.log(`Device disconnected: ${deviceId}`)
    devices.delete(deviceId)
  })
})

server.listen(3000, () => {
  console.log('Sync server listening on port 3000')
})

function isValidToken(token) {
  // 实现你的 token 验证逻辑
  return token && token.length > 0
}
```

### HTTP 长轮询服务器

```javascript
// polling-server.js
const express = require('express')
const app = express()

app.use(express.json())

// 存储待发送的消息
const messageQueues = new Map()

// 获取消息（长轮询）
app.get('/api/cache-sync', (req, res) => {
  const deviceId = req.query.deviceId
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  const queue = messageQueues.get(deviceId) || []
  messageQueues.set(deviceId, [])
  
  res.json(queue)
})

// 发送消息
app.post('/api/cache-sync', (req, res) => {
  const message = req.body
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // 添加到其他设备的队列
  for (const [deviceId, queue] of messageQueues) {
    if (deviceId !== message.deviceId) {
      queue.push(message)
    }
  }
  
  res.json({ success: true })
})

app.listen(3000, () => {
  console.log('Polling server listening on port 3000')
})
```

## 配置选项

### RemoteSyncOptions

```typescript
interface RemoteSyncOptions {
  /** 服务器 URL */
  serverUrl: string
  
  /** 传输层类型 */
  transport?: 'websocket' | 'polling' | 'sse'
  
  /** 设备 ID（自动生成并持久化） */
  deviceId?: string
  
  /** 认证令牌 */
  authToken?: string
  
  /** 心跳间隔（毫秒，默认 30000） */
  heartbeatInterval?: number
  
  /** 重连延迟（毫秒，默认 1000） */
  reconnectDelay?: number
  
  /** 最大重连次数（默认 10） */
  maxReconnectAttempts?: number
  
  /** 请求超时（毫秒，默认 5000） */
  timeout?: number
  
  /** 是否启用压缩 */
  compression?: boolean
}
```

## API 参考

### RemoteSyncManager

```typescript
class RemoteSyncManager {
  /** 连接到服务器 */
  connect(): Promise<void>
  
  /** 断开连接 */
  disconnect(): void
  
  /** 同步单个数据 */
  sync(key: string, data: SyncData, operation: 'set' | 'remove'): Promise<void>
  
  /** 批量同步 */
  syncBatch(items: Array<{
    key: string
    data: SyncData
    operation: 'set' | 'remove'
  }>): Promise<void>
  
  /** 获取连接状态 */
  getConnectionState(): ConnectionState
  
  /** 监听消息 */
  on(event: 'message' | 'state', handler: Function): void
  
  /** 移除监听器 */
  off(event: 'message' | 'state', handler: Function): void
  
  /** 销毁 */
  destroy(): void
}
```

## 最佳实践

### 1. 选择合适的传输层

```typescript
// 实时性要求高，使用 WebSocket
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  transport: 'websocket',
})

// 兼容性要求高，使用长轮询
const remoteSync = new RemoteSyncManager({
  serverUrl: 'https://api.example.com/sync',
  transport: 'polling',
})

// 单向推送场景，使用 SSE
const remoteSync = new RemoteSyncManager({
  serverUrl: 'https://api.example.com/stream',
  transport: 'sse',
})
```

### 2. 处理连接状态

```typescript
remoteSync.on('state', (state) => {
  switch (state) {
    case 'connected':
      showNotification('✅ 已连接', 'success')
      break
    
    case 'connecting':
      showNotification('🔄 连接中...', 'info')
      break
    
    case 'disconnected':
      showNotification('⚠️ 已断开', 'warning')
      break
    
    case 'error':
      showNotification('❌ 连接失败', 'error')
      break
  }
})
```

### 3. 批量同步优化

```typescript
// 使用批量同步减少请求次数
const pendingSync: Array<{
  key: string
  data: SyncData
  operation: 'set' | 'remove'
}> = []

// 累积变更
cache.on('set', (event) => {
  pendingSync.push({
    key: event.key,
    data: {
      value: event.value,
      timestamp: event.timestamp,
      version: 1,
      source: deviceId,
    },
    operation: 'set',
  })
})

// 每秒批量同步一次
setInterval(async () => {
  if (pendingSync.length > 0) {
    const batch = [...pendingSync]
    pendingSync.length = 0
    
    await remoteSync.syncBatch(batch)
  }
}, 1000)
```

### 4. 错误处理

```typescript
try {
  await remoteSync.connect()
}
catch (error) {
  console.error('Failed to connect:', error)
  
  // 回退到仅本地缓存
  showNotification('无法连接到同步服务器，仅使用本地缓存')
}

// 监听同步失败
remoteSync.on('state', (state) => {
  if (state === 'error') {
    // 通知用户
    showNotification('同步出现问题，稍后将自动重试')
  }
})
```

## 安全建议

### 1. 使用 HTTPS/WSS

```typescript
// ✅ 好：使用加密连接
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://secure-api.example.com/sync',
  authToken: token,
})

// ❌ 不好：使用非加密连接
const remoteSync = new RemoteSyncManager({
  serverUrl: 'ws://api.example.com/sync',
})
```

### 2. Token 认证

```typescript
// 从安全的地方获取 token
const authToken = await getAuthToken()

const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  authToken,
})

// 定期刷新 token
setInterval(async () => {
  const newToken = await refreshAuthToken()
  // 重新连接以使用新 token
  remoteSync.disconnect()
  // 更新配置并重连...
}, 3600000) // 每小时刷新
```

### 3. 数据加密

```typescript
// 结合缓存加密
const cache = new CacheManager({
  security: {
    encryption: {
      enabled: true,
      algorithm: 'AES',
      secretKey: userSecretKey,
    },
  },
})

// 同步的数据会自动加密
```

## 性能优化

### 1. 减少同步频率

```typescript
// 使用批量同步
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  // 配置会在应用层处理批量
})

// 本地同步也使用批量
const localSync = new SyncManager(cache, {
  batchInterval: 500,  // 500ms 批量
})
```

### 2. 选择性同步

```typescript
// 只同步重要数据
cache.on('set', async (event) => {
  // 只同步特定键
  if (event.key.startsWith('important:')) {
    await remoteSync.sync(event.key, syncData, 'set')
  }
})
```

### 3. 压缩传输

```typescript
const remoteSync = new RemoteSyncManager({
  serverUrl: 'wss://api.example.com/sync',
  compression: true,  // 启用压缩
})
```

## 故障排除

### WebSocket 连接失败

1. 检查服务器地址：
```typescript
console.log('Server URL:', remoteSync['options'].serverUrl)
```

2. 检查认证：
```typescript
console.log('Auth token:', remoteSync['options'].authToken)
```

3. 查看浏览器控制台网络标签，检查 WebSocket 连接

### 重连循环

可能是服务器拒绝连接，检查：
- Token 是否有效
- 服务器是否在运行
- 防火墙是否阻止连接

### 同步延迟高

1. 减少心跳间隔：
```typescript
heartbeatInterval: 10000  // 改为 10 秒
```

2. 使用批量同步：
```typescript
batchInterval: 100  // 100ms 批量
```

3. 检查网络延迟

## 浏览器兼容性

| 传输层 | Chrome | Firefox | Safari | Edge |
|--------|--------|---------|--------|------|
| WebSocket | 16+ | 11+ | 10+ | 12+ |
| Polling | ✅ | ✅ | ✅ | ✅ |
| SSE | 6+ | 6+ | 5+ | 79+ |

## 总结

跨设备同步功能提供了：

- ✅ **多传输层支持** - WebSocket、轮询、SSE
- ✅ **自动重连** - 断线自动恢复
- ✅ **消息队列** - 离线时缓存，上线后同步
- ✅ **心跳机制** - 保持连接活跃
- ✅ **状态监控** - 实时了解同步情况

通过合理配置，可以构建出色的跨设备协同体验！

