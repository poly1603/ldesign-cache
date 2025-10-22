/**
 * 远程同步适配器
 * 
 * 提供跨设备同步的传输层抽象，支持：
 * - WebSocket 实时同步
 * - HTTP 长轮询
 * - Server-Sent Events (SSE)
 */

import type { SyncData } from './sync-manager'
import { EventEmitter } from '../utils'

/**
 * 传输层类型
 */
export type TransportType = 'websocket' | 'polling' | 'sse'

/**
 * 连接状态
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * 远程同步消息
 */
export interface RemoteSyncMessage {
  type: 'sync' | 'ack' | 'conflict' | 'heartbeat'
  deviceId: string
  timestamp: number
  data?: {
    key: string
    syncData: SyncData
    operation: 'set' | 'remove' | 'clear'
  }
  batch?: Array<{
    key: string
    syncData: SyncData
    operation: 'set' | 'remove'
  }>
}

/**
 * 远程同步配置
 */
export interface RemoteSyncOptions {
  /** 服务器 URL */
  serverUrl: string
  /** 传输层类型 */
  transport?: TransportType
  /** 设备 ID */
  deviceId?: string
  /** 认证令牌 */
  authToken?: string
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number
  /** 重连延迟（毫秒） */
  reconnectDelay?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 请求超时（毫秒） */
  timeout?: number
  /** 是否启用压缩 */
  compression?: boolean
}

/**
 * 传输层接口
 */
export interface ITransport {
  /** 连接状态 */
  readonly state: ConnectionState

  /** 连接到服务器 */
  connect(): Promise<void>

  /** 断开连接 */
  disconnect(): void

  /** 发送消息 */
  send(message: RemoteSyncMessage): Promise<void>

  /** 监听消息 */
  onMessage(handler: (message: RemoteSyncMessage) => void): void

  /** 监听连接状态变化 */
  onStateChange(handler: (state: ConnectionState) => void): void
}

/**
 * WebSocket 传输层
 */
export class WebSocketTransport implements ITransport {
  private ws?: WebSocket
  private _state: ConnectionState = 'disconnected'
  private messageHandler?: (message: RemoteSyncMessage) => void
  private stateChangeHandler?: (state: ConnectionState) => void
  private reconnectAttempts = 0
  private reconnectTimer?: number
  private heartbeatTimer?: number

  constructor(private options: RemoteSyncOptions) { }

  get state(): ConnectionState {
    return this._state
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this._state === 'connected' || this._state === 'connecting') {
      return
    }

    this.setState('connecting')

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.options.serverUrl)
        if (this.options.authToken) {
          url.searchParams.set('token', this.options.authToken)
        }
        if (this.options.deviceId) {
          url.searchParams.set('deviceId', this.options.deviceId)
        }

        this.ws = new WebSocket(url.toString())

        this.ws.onopen = () => {
          this.setState('connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          resolve()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.setState('error')
          reject(new Error('WebSocket connection failed'))
        }

        this.ws.onclose = () => {
          this.setState('disconnected')
          this.stopHeartbeat()
          this.attemptReconnect()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: RemoteSyncMessage = JSON.parse(event.data)
            if (this.messageHandler) {
              this.messageHandler(message)
            }
          }
          catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
      }
      catch (error) {
        this.setState('error')
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }

    if (this.ws) {
      this.ws.close()
      this.ws = undefined
    }

    this.setState('disconnected')
  }

  /**
   * 发送消息
   */
  async send(message: RemoteSyncMessage): Promise<void> {
    if (this._state !== 'connected' || !this.ws) {
      throw new Error('WebSocket is not connected')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Send timeout'))
      }, this.options.timeout || 5000)

      try {
        this.ws!.send(JSON.stringify(message))
        clearTimeout(timeout)
        resolve()
      }
      catch (error) {
        clearTimeout(timeout)
        reject(error)
      }
    })
  }

  /**
   * 监听消息
   */
  onMessage(handler: (message: RemoteSyncMessage) => void): void {
    this.messageHandler = handler
  }

  /**
   * 监听状态变化
   */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler
  }

  /**
   * 设置状态
   */
  private setState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state
      if (this.stateChangeHandler) {
        this.stateChangeHandler(state)
      }
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    const maxAttempts = this.options.maxReconnectAttempts || 10

    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    const delay = this.options.reconnectDelay || 1000
    const backoffDelay = Math.min(delay * Math.pow(2, this.reconnectAttempts), 30000)

    this.reconnectAttempts++
    console.log(`Reconnecting in ${backoffDelay}ms (attempt ${this.reconnectAttempts}/${maxAttempts})`)

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
      })
    }, backoffDelay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval || 30000

    this.heartbeatTimer = window.setInterval(() => {
      this.send({
        type: 'heartbeat',
        deviceId: this.options.deviceId || 'unknown',
        timestamp: Date.now(),
      }).catch(error => {
        console.error('Heartbeat failed:', error)
      })
    }, interval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }
}

/**
 * HTTP 长轮询传输层
 */
export class PollingTransport implements ITransport {
  private _state: ConnectionState = 'disconnected'
  private messageHandler?: (message: RemoteSyncMessage) => void
  private stateChangeHandler?: (state: ConnectionState) => void
  private pollingTimer?: number
  private abortController?: AbortController

  constructor(private options: RemoteSyncOptions) { }

  get state(): ConnectionState {
    return this._state
  }

  /**
   * 连接（开始轮询）
   */
  async connect(): Promise<void> {
    if (this._state === 'connected' || this._state === 'connecting') {
      return
    }

    this.setState('connecting')

    try {
      await this.poll()
      this.setState('connected')
      this.startPolling()
    }
    catch (error) {
      this.setState('error')
      throw error
    }
  }

  /**
   * 断开连接（停止轮询）
   */
  disconnect(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer)
      this.pollingTimer = undefined
    }

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = undefined
    }

    this.setState('disconnected')
  }

  /**
   * 发送消息
   */
  async send(message: RemoteSyncMessage): Promise<void> {
    if (this._state !== 'connected') {
      throw new Error('Polling transport is not connected')
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.options.authToken) {
      headers['Authorization'] = `Bearer ${this.options.authToken}`
    }

    const response = await fetch(this.options.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(this.options.timeout || 5000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * 监听消息
   */
  onMessage(handler: (message: RemoteSyncMessage) => void): void {
    this.messageHandler = handler
  }

  /**
   * 监听状态变化
   */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler
  }

  /**
   * 设置状态
   */
  private setState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state
      if (this.stateChangeHandler) {
        this.stateChangeHandler(state)
      }
    }
  }

  /**
   * 开始轮询
   */
  private startPolling(): void {
    const interval = this.options.heartbeatInterval || 5000

    this.pollingTimer = window.setTimeout(() => {
      this.poll()
        .then(() => this.startPolling())
        .catch(error => {
          console.error('Polling failed:', error)
          this.setState('error')
          // 短暂延迟后重试
          setTimeout(() => {
            this.setState('connecting')
            this.startPolling()
          }, 1000)
        })
    }, interval)
  }

  /**
   * 执行轮询
   */
  private async poll(): Promise<void> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
    }

    if (this.options.authToken) {
      headers['Authorization'] = `Bearer ${this.options.authToken}`
    }

    this.abortController = new AbortController()

    const url = new URL(this.options.serverUrl)
    if (this.options.deviceId) {
      url.searchParams.set('deviceId', this.options.deviceId)
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: this.abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const messages: RemoteSyncMessage[] = await response.json()

    if (messages && Array.isArray(messages)) {
      for (const message of messages) {
        if (this.messageHandler) {
          this.messageHandler(message)
        }
      }
    }
  }
}

/**
 * Server-Sent Events 传输层
 */
export class SSETransport implements ITransport {
  private eventSource?: EventSource
  private _state: ConnectionState = 'disconnected'
  private messageHandler?: (message: RemoteSyncMessage) => void
  private stateChangeHandler?: (state: ConnectionState) => void

  constructor(private options: RemoteSyncOptions) { }

  get state(): ConnectionState {
    return this._state
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this._state === 'connected' || this._state === 'connecting') {
      return
    }

    this.setState('connecting')

    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.options.serverUrl)
        if (this.options.deviceId) {
          url.searchParams.set('deviceId', this.options.deviceId)
        }
        if (this.options.authToken) {
          url.searchParams.set('token', this.options.authToken)
        }

        this.eventSource = new EventSource(url.toString())

        this.eventSource.onopen = () => {
          this.setState('connected')
          resolve()
        }

        this.eventSource.onerror = (error) => {
          console.error('SSE error:', error)
          this.setState('error')
          reject(new Error('SSE connection failed'))
        }

        this.eventSource.onmessage = (event) => {
          try {
            const message: RemoteSyncMessage = JSON.parse(event.data)
            if (this.messageHandler) {
              this.messageHandler(message)
            }
          }
          catch (error) {
            console.error('Failed to parse SSE message:', error)
          }
        }
      }
      catch (error) {
        this.setState('error')
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }

    this.setState('disconnected')
  }

  /**
   * 发送消息（通过 HTTP POST）
   */
  async send(message: RemoteSyncMessage): Promise<void> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.options.authToken) {
      headers['Authorization'] = `Bearer ${this.options.authToken}`
    }

    const response = await fetch(this.options.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(this.options.timeout || 5000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * 监听消息
   */
  onMessage(handler: (message: RemoteSyncMessage) => void): void {
    this.messageHandler = handler
  }

  /**
   * 监听状态变化
   */
  onStateChange(handler: (state: ConnectionState) => void): void {
    this.stateChangeHandler = handler
  }

  /**
   * 设置状态
   */
  private setState(state: ConnectionState): void {
    if (this._state !== state) {
      this._state = state
      if (this.stateChangeHandler) {
        this.stateChangeHandler(state)
      }
    }
  }
}

/**
 * 远程同步管理器
 */
export class RemoteSyncManager {
  private transport: ITransport
  private readonly deviceId: string
  private readonly emitter = new EventEmitter<any>()
  private messageQueue: RemoteSyncMessage[] = []
  private syncInProgress = false

  constructor(private options: RemoteSyncOptions) {
    this.deviceId = options.deviceId || this.generateDeviceId()

    // 创建传输层
    const transportType = options.transport || 'websocket'
    this.transport = this.createTransport(transportType)

    // 设置消息处理
    this.transport.onMessage((message) => this.handleMessage(message))

    // 设置状态变化处理
    this.transport.onStateChange((state) => {
      this.emitter.emit('state', state)

      // 连接成功后处理队列
      if (state === 'connected') {
        this.processMessageQueue()
      }
    })
  }

  /**
   * 生成设备 ID
   */
  private generateDeviceId(): string {
    // 尝试从 localStorage 获取持久化的设备 ID
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('__device_id__')
      if (stored) {
        return stored
      }

      const newId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      window.localStorage.setItem('__device_id__', newId)
      return newId
    }

    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建传输层
   */
  private createTransport(type: TransportType): ITransport {
    switch (type) {
      case 'websocket':
        return new WebSocketTransport(this.options)
      case 'polling':
        return new PollingTransport(this.options)
      case 'sse':
        return new SSETransport(this.options)
      default:
        throw new Error(`Unknown transport type: ${type}`)
    }
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    await this.transport.connect()
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.transport.disconnect()
  }

  /**
   * 同步数据
   */
  async sync(key: string, data: SyncData, operation: 'set' | 'remove'): Promise<void> {
    const message: RemoteSyncMessage = {
      type: 'sync',
      deviceId: this.deviceId,
      timestamp: Date.now(),
      data: {
        key,
        syncData: data,
        operation,
      },
    }

    if (this.transport.state === 'connected') {
      try {
        await this.transport.send(message)
      }
      catch (error) {
        console.error('Failed to send sync message:', error)
        this.messageQueue.push(message)
      }
    }
    else {
      // 连接断开，加入队列
      this.messageQueue.push(message)
    }
  }

  /**
   * 批量同步
   */
  async syncBatch(items: Array<{ key: string, data: SyncData, operation: 'set' | 'remove' }>): Promise<void> {
    const message: RemoteSyncMessage = {
      type: 'sync',
      deviceId: this.deviceId,
      timestamp: Date.now(),
      batch: items.map(item => ({
        key: item.key,
        syncData: item.data,
        operation: item.operation,
      })),
    }

    if (this.transport.state === 'connected') {
      try {
        await this.transport.send(message)
      }
      catch (error) {
        console.error('Failed to send batch sync:', error)
        this.messageQueue.push(message)
      }
    }
    else {
      this.messageQueue.push(message)
    }
  }

  /**
   * 处理接收的消息
   */
  private handleMessage(message: RemoteSyncMessage): void {
    // 忽略自己发送的消息
    if (message.deviceId === this.deviceId) {
      return
    }

    this.emitter.emit('message', message)
  }

  /**
   * 处理消息队列
   */
  private async processMessageQueue(): Promise<void> {
    if (this.syncInProgress || this.messageQueue.length === 0) {
      return
    }

    this.syncInProgress = true

    const queue = [...this.messageQueue]
    this.messageQueue = []

    for (const message of queue) {
      try {
        await this.transport.send(message)
      }
      catch (error) {
        console.error('Failed to send queued message:', error)
        this.messageQueue.push(message)
      }
    }

    this.syncInProgress = false
  }

  /**
   * 获取连接状态
   */
  getConnectionState(): ConnectionState {
    return this.transport.state
  }

  /**
   * 监听事件
   */
  on(event: 'message' | 'state', handler: any): void {
    this.emitter.on(event, handler)
  }

  /**
   * 移除监听器
   */
  off(event: 'message' | 'state', handler: any): void {
    this.emitter.off(event, handler)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.transport.disconnect()
    this.emitter.removeAllListeners()
    this.messageQueue = []
  }
}


